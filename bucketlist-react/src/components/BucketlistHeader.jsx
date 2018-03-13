import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/logo.svg';

const BucketListHeader = props => {
    return (
        <div className="header-container">
            <div className="left">
              <Link to="/u" id="logo">
                <img src={logo} alt="Logo"/> <span className="logo-text">Bucketlist</span>
              </Link>
            </div>
            <div className="left">
              <div className="left pagelet-title-wrapper ellipsable">
                <span className={"pagelet-title ellipsable " + ((props.currentBucket.id) ? '':'hidden')}>
                    {props.currentBucket.name} – {props.currentBucket.description}
                </span>
              </div>
            </div>
            <div className="right">
            <header id="content-header">
        
                <div className={"right " + ((props.currentBucket.id)? '':'hidden')}>
                    <ul id="context-actions">
                        <li>
                        <a href="" title="Create a goal" onClick={props.toggleItemForm}>
                            <i className="glyphicon glyphicon-plus"></i>
                            <span className="icon-label">Add a goal</span>
                        </a>
                        </li>
                        <li>
                        <a href="" title="Edit bucket" onClick={props.toggleEditBucketForm}>
                            <i className="glyphicon glyphicon-pencil"></i>
                            <span className="icon-label">Edit bucket</span>
                        </a>
                        </li>
                        <li>
                        <a href="" title="Delete bucket" onClick={props.onBucketDeleteClick}>
                            <i className="glyphicon glyphicon-trash"></i>
                            <span className="icon-label">Delete bucket</span>
                        </a>
                        </li>
                    </ul>
                    <div className="clearfix"></div>
                </div>
            </header>
            </div>
            <div className="clearfix"></div>
          </div>
    );
}

export default BucketListHeader;
