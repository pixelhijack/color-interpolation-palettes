import React, { Component } from 'react';
import './App.css';

import interpolate from 'color-interpolate';
import palettes from 'nice-color-palettes/1000';

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

const Palette = ({ colors }) => (
    <div
        className='palette'
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

class App extends Component {
    constructor() {
        super();
        this.state = { paletteSize: 5 };
    }
    setSize(event){
        this.setState({ paletteSize: event.target.value });
    }
    render() {
        return (
            <div className='App'>
                <label>
                    Size of palettes:
                    <input
                        type='number'
                        value={this.state.paletteSize}
                        onChange={this.setSize.bind(this)}
                    />
                </label>
                {
                    mixPalette(this.state.paletteSize).map((palette, i) => (
                        <Palette key={i} colors={palette} />
                    ))
                }
            </div>
        );
    }
}

export default App;
