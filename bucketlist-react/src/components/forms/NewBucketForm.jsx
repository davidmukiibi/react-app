import React from 'react';

const NewBucketForm = props => {
    return (
        <form onSubmit={props.onSubmit} id="new-bucket"
        className={props.formClass}>
            <div className="overlay-header">
                <span className="o-title">Create a new bucket</span>
            </div>
            <div className="overlay-body">
                <div className="form-group">
                    <input name="name" 
                    onChange={props.onChange} 
                    value={props.name} 
                    type="text" 
                    className="form-control" 
                    placeholder="Name"
                    required />
                </div>
                <div className="form-group">
                    <textarea name="description" 
                    onChange={props.onChange} 
                    value={props.description} 
                    placeholder="Description" 
                    rows="4" 
                    className="form-control"
                    required></textarea>
                </div>
                <div className="form-group">
                    <label>
                        <input onChange={props.onChange} name="automaticClose" type="checkbox" checked={props.automaticClose} />
                        <span className="label-text">Automatically close when finished.</span>
                    </label>
                </div>
                <div className="form-group buttons">
                    <div className="right">
                        <div className="form-feedback positive">
                            <span className="feedback-icon">
                            <i className="glyphicon glyphicon-ok"></i>
                            </span>
                            <span className="feedback-message">
                            Created a new bucket.
                            </span>
                        </div>
                        <div className="form-feedback negative">
                            <span className="feedback-icon">
                            <i className="glyphicon glyphicon-remove"></i>
                            </span>
                            <span className="feedback-message"></span>
                        </div>
                        <div className="form-feedback processing">
                            <span className="feedback-icon loading"></span>
                            <span className="feedback-message">Processing...</span>
                        </div>
                        <button className="btn btn-primary" disabled={props.isDisabled}>Create</button>
                        <button onClick={props.close} className="btn btn-default">Close</button>
                    </div>
                    <div className="clearfix"></div>
                </div>
            </div>
        </form>
    )
}

export default NewBucketForm;
