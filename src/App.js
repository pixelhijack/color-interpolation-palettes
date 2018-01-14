import React, { Component } from 'react';
import './App.css';

import interpolate from 'color-interpolate';
import palettes from 'nice-color-palettes/1000';

import { deltaE } from './lab';
//import { rgbToHex, hexToRgb } from './rgbToHex';

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
        const paletteRGB = palette.map(
            rgbString => {
                const rgbNumber = rgbString.match(/\d+/g);
                return [rgbNumber[0], rgbNumber[1], rgbNumber[2]];
            }
        );

        const shifted = getClosestLab([pixels[i], pixels[i+1], pixels[i+2]], paletteRGB);

        pixels[i]     = shifted[0];
        pixels[i + 1] = shifted[1];
        pixels[i + 2] = shifted[2];
        if(Number.isInteger((i / pixels.length) * 100)){
            //console.clear();
            console.log('Processing... %s%', (i / pixels.length) * 100);
        }
    }
    console.timeEnd('Processed in');
    return image;
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            paletteSize: 5,
            canvasWidth: 10,
            canvasHeight: 10,
            selectedPalette: [
                'rgb(221,114,78)',
                'rgb(202,61,66)',
                'rgb(149,39,62)',
                'rgb(84,53,68)',
                'rgb(83,119,122)'
            ]
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
            console.time('Processed in');
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
            e.target.value = null;
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

export default App;
