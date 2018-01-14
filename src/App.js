import React, { Component } from 'react';
import './App.css';

import interpolate from 'color-interpolate';
import palettes from 'nice-color-palettes/1000';

function rgbToHex(red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));

const times = n => {
    let i = 0,
        idx = [];
    while(++i <= n) { idx.push(i); }
    return idx;
};

const mixPalette = needed => palettes.map(colors => {
    const interpolation = interpolate(colors);
    const gradient = times(needed).map(i =>
        interpolation(i / needed)
    );
    return gradient;
});

const Color = ({ color, children }) => (
    <div className='color' style={{
        width: 150,
        height: '2em',
        lineHeight: '2em',
        backgroundColor: color
    }}>
        {children}
    </div>
);

const Palette = ({ colors, onClick }) => (
    <div
        className='palette'
        onClick={onClick}
        style={{
            float: 'left',
            margin: 5,
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
        }}>
        {colors.map((color, i) =>
            (
                <Color color={color} key={i}>
                    {color}
                </Color>
            )
        )}
    </div>
);

const FileUpload = ({ onChange }) => (
    <input
        type='file'
        id='fileUpload'
        name='fileUpload'
        accept='image/*'
        onChange={(event) => {
            onChange(event.target.files[0]);
        }}
    />
);

let ctx = undefined;

class Canvas extends React.Component {
    componentDidMount() {
        ctx = this.refs.canvas.getContext('2d');
    }
    render() {
        return (
            <canvas
                ref='canvas'
                width={this.props.width}
                height={this.props.height}/>
        );
    }
}

const getClosestColor = (color, colors = []) => {
    const proximities = colors.map(
        c => ({
            color: c,
            closeness: colorDifference.compare(color, c)
        })
    );
    const closest = proximities.sort((a, b) => {
        if(a.closeness < b.closeness) { return -1; }
        if(a.closeness > b.closeness) { return 1; }
        return 0;
    });
    return closest[0] && closest[0].color;
};

const getClosestLab = (color, colors = []) => {
    const proximities = colors.map(
        c => ({
            color: c,
            closeness: deltaE(color, c)
        })
    );
    const closest = proximities.sort((a, b) => {
        if(a.closeness < b.closeness) { return -1; }
        if(a.closeness > b.closeness) { return 1; }
        return 0;
    });
    return closest[0] && closest[0].color;
};

const shiftColors = (image, palette = []) => {
    let pixels = image.data;
    for (var i = 0; i < pixels.length; i += 4) {
        /*const hex = rgbToHex(pixels[i], pixels[i+1], pixels[i+2]);
        const paletteHex = palette.map(
            rgbString => {
                const rgbNumber = rgbString.match(/\d+/g);
                const hex = rgbToHex(rgbNumber[0], rgbNumber[1], rgbNumber[2]);
                return hex;
            }
        );*/
        const paletteRGB = palette.map(
            rgbString => {
                const rgbNumber = rgbString.match(/\d+/g);
                return [rgbNumber[0], rgbNumber[1], rgbNumber[2]];
            }
        );
        //const shifted = getClosestColor(hex, paletteHex);
        const shifted = getClosestLab([pixels[i], pixels[i+1], pixels[i+2]], paletteRGB);
        //const shiftedRGB = hexToRgb(shifted);
        pixels[i]     = shifted[0];
        pixels[i + 1] = shifted[1];
        pixels[i + 2] = shifted[2];
        if(Number.isInteger((i / pixels.length) * 100)){
            console.clear();
            console.log('Processing... %s%', (i / pixels.length) * 100);
        }
    }
    return image;
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            paletteSize: 15,
            canvasWidth: 10,
            canvasHeight: 10,
            selectedPalette: undefined
        };
    }
    setSize(event){
        this.setState({ paletteSize: event.target.value });
    }
    onPaletteSelect(palette){
        this.setState({
            selectedPalette: palette
        });
    }
    onFileUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e){
            const image = new Image();
            image.onload = function(){
                this.setState({
                    canvasWidth: image.width,
                    canvasHeight: image.height
                });
                ctx.drawImage(image, 0, 0);
                const manipulated = shiftColors(
                    ctx.getImageData(0,0,this.state.canvasWidth,this.state.canvasHeight),
                    this.state.selectedPalette
                );
                ctx.putImageData(manipulated, 0, 0);
            }.bind(this);
            image.src = e.target.result;
        }.bind(this);
        reader.readAsDataURL(file);
    }
    render() {
        return (
            <div className='App'>
                <hgroup>
                    <h1>
                        Color mixing fun
                    </h1>
                    <h2>
                        with 'color-interpolation' and 'nice-color-palettes' repos and a bit of FRP
                    </h2>
                </hgroup>
                <label>
                    Change the size of palettes!
                    <input
                        type='number'
                        value={this.state.paletteSize}
                        onChange={this.setSize.bind(this)}
                    />
                </label>
                <FileUpload onChange={this.onFileUpload.bind(this)} />
                <Canvas
                    width={this.state.canvasWidth}
                    height={this.state.canvasHeight}
                />
                {
                    mixPalette(this.state.paletteSize).map((palette, i) => (
                        <Palette
                            key={i}
                            colors={palette}
                            onClick={this.onPaletteSelect.bind(this, palette)}
                        />
                    ))
                }
            </div>
        );
    }
}

// the following functions are based off of the pseudocode
// found on www.easyrgb.com

function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)) * 255,
          Math.max(0, Math.min(1, g)) * 255,
          Math.max(0, Math.min(1, b)) * 255]
}


function rgb2lab(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB){
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}


export default App;
