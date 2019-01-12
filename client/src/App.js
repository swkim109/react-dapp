import React, { Component } from "react";
import "./App.css";
import logo from "./logo.svg";

class App extends Component {

    render() {

        return (

            //JSX
            <div className="App">
                <header>
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h1 className="App-font">Hello, React!</h1>
                </header>
            </div>

        );


    }

}


export default App;
