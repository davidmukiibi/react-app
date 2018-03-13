import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import App from './App.jsx'; 

export default () => (
    <BrowserRouter>
        <div>
            <Route exact path="/" component={Login} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/u" component={App} />
            <Route exact path="/register" component={Register} />
        </div>
    </BrowserRouter>
)
