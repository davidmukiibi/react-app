import React, { Component } from 'react';
import '../css/bucket-list.min.css';
import bucketIcon from '../images/bucket.svg';

export default class BucketList extends Component{

    render(){

        if (!this.props.buckets || this.props.buckets.length === 0){
            return (
                <div className="no-buckets">No buckets to display.</div>
            )
        }
       
        let buckets = this.props.buckets.map(bucket => {
            let classes = "bucket";
            
            if (this.props && this.props.currentBucketId && bucket.id === this.props.currentBucketId){
                classes += " active";
            }
            
            return (
                <a key={bucket.id} className={classes} onClick={this.props.onItemClick.bind(this, bucket.id)}>
                    <div className="icon-wrapper">
                        <img src={bucketIcon} alt="bucket icon"/>
                    </div>
                    <div className="bucket-content">
                        <div className="bucket-title">
                            <span className="ellipsable">
                                {bucket.name}
                            </span>
                        </div>
                        <div className="bucket-description">
                            <span className="ellipsable">
                                {bucket.description}
                            </span>
                        </div>
                    </div>
                    <div className="clearfix"></div>
                </a>
            );
        });

        return (
            <div className="bucket-container">
                {buckets}
            </div>
        );
    }
}
