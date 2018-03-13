import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { xhr } from '../Request';
import '../css/anonymous.min.css';
import logo from '../images/logo-colored.svg';
import $ from 'jquery';

export default class Login extends Component{
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            isLoggedIn: false,
            isLoading: false,
            errorMessage: ''
        }

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount(){
        let auth = JSON.parse(localStorage.getItem('auth'));
        if (auth && auth.token){
            let {state} = this;
            state.isLoggedIn = true;
            this.setState(state);
        }
    }

    onChange(e){
        let {state} = this;
        state[e.target.name] = e.target.value;
        this.setState(state);
    }

    onSubmit(e){
        e.preventDefault();
        
        let {state} = this;
        let {username, password} = state;
        state.isLoading = true;
        this.setState(state);

        return xhr.post('/auth/login', {
            username: username.trim(),
            password: password.trim()
        })
        .then(response => {
            let {data} = response;
            localStorage.setItem('auth', JSON.stringify(data));
            state.isLoggedIn = true;
            this.setState(state);
            $("#dialog.error").hide();
        })
        .catch(error => {
            state.isLoading = false;
            this.setState(state);

            if (error.response && error.response.status === 500){
                $("#dialog.error").text("Awe snap! Something went wrong on our end. We will fix it.").fadeIn();
            }

            if (error.response && error.response.status === 401){
                $("#dialog.error").text("Invalid login credentials.").fadeIn();
            }

            if (error.request.status === 0){
                $("#dialog.error").text("It seems you are offline. Connect to the internet and try again.").fadeIn();
            }

            setTimeout(() => {
                $("#dialog.error").fadeOut();
            }, 10000);
        });

    }

    render(){
        
        if (this.state.isLoggedIn){
            return <Redirect to="/u" />
        }

        let buttonText = 'Sign in';

        if (this.state.isLoading) {
            buttonText = 'Signing in...';
        }

        return (
            <div id="anonymouscontent" className="flex-center">
                <header id="header-anonymous">
                    <Link to="/" className="logo">
                        <img src={logo} alt="Logo" />
                    </Link>
                </header>
                <div id="entry-form-content">
                    <span className="form-heading">Sign in to your account.</span>
                    <form action="" id="entry-form" onSubmit={this.onSubmit}>
                        <div className="form-group">
                            <input onChange={this.onChange} name="username" className="form-control input-lg" type="text" placeholder="Username or email" required value={this.state.username} />
                        </div>
                        <div className="form-group">
                            <input onChange={this.onChange} name="password" className="form-control input-lg" type="password" placeholder="Password" required value={this.state.password} />
                        </div>

                        <div className="form-group">
                            <button className="btn btn-primary input-lg" disabled={this.state.isLoading}>{buttonText}</button>
                            <div className="clearfix"></div>
                        </div>
                    </form>

                    <div className="copy">
                        <p>
                            <Link to="/register">Create an account</Link> if you have none.
                        </p>
                    </div>
                </div>
                
            </div>
        );
    }
}
