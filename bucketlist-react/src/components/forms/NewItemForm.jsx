import React from 'react';

const NewItemForm = props => {
    return <form onSubmit={props.onSubmit} 
    className={props.formClass}>
    <div className="overlay-header">
      <span className="o-title">Create a new goal in - {props.bucketName}</span>
    </div>
    <div className="overlay-body">
      <div className="form-group">
        <input onChange={props.onChange} 
          value={props.title}
          name="title" 
          type="text" 
          className="form-control" 
          placeholder="Title"
          required />
      </div>
      <div className="form-group">
        <label htmlFor="">Target date</label>
        <input onChange={props.onChange} 
          value={props.dueDate}
          name="dueDate" 
          type="date" 
          className="form-control" 
          placeholder="Title"
          required />
      </div>
      <div className="form-group">
        <textarea onChange={props.onChange} 
          value={props.description}
          name="description" 
          placeholder="Description" 
          rows="4" type="text" 
          className="form-control"
          required ></textarea>
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
              Added a goal to ({props.bucketName}).
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
          <button className="btn btn-primary" disabled={props.isDisabled}>Add</button>
          <button onClick={props.close} className="btn btn-default">Close</button>
        </div>
        <div className="clearfix"></div>
      </div>
    </div>
  </form>
}

export default NewItemForm;
