import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { xhr } from './Request';
import BucketList from './components/BucketList.jsx';
import BucketItem from './components/BucketItem.jsx';
import bucketIconLight from './images/bucket-light.svg';
import BucketListHeader from './components/BucketlistHeader.jsx';
import NewBucketForm from './components/forms/NewBucketForm.jsx';
import EditBucketForm from './components/forms/EditBucketForm.jsx';
import NewItemForm from './components/forms/NewItemForm.jsx';
import Search from './components/Search.jsx';
import ResetPasswordForm from './components/forms/ResetPasswordForm.jsx';
import $ from 'jquery';

export default class App extends Component {
  
  constructor(){
    super();
    this.bindEvents();
    this.auth = JSON.parse(localStorage.getItem('auth'));
    
    this.xhr = xhr
    if (this.auth && this.auth.token){
      this.xhr.defaults.headers['X-Token'] = this.auth.token;
    }
  }

  bindEvents(){
    this.onBucketItemClick = this.onBucketItemClick.bind(this);
    this.onNewBucketChange = this.onNewBucketChange.bind(this);
    this.onNewItemChange = this.onNewItemChange.bind(this);
    this.onNewBucketFormSubmit = this.onNewBucketFormSubmit.bind(this);
    this.onNewItemFormSubmit = this.onNewItemFormSubmit.bind(this);
    this.toggleBucketForm = this.toggleBucketForm.bind(this);
    this.toggleItem = this.toggleItem.bind(this);
    this.onItemEdit = this.onItemEdit;
    this.onItemDelete = this.onItemDelete.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    
  }

  componentWillMount(){
    
    this.state = {
      showSearch: false,
      showSearchResults: false,
      isSearching: false,
      search: '',
      prevSearchTerm: '',
      searchResults: [],
      resetPassword: {
        oldPassword: '',
        newPasswordRepeat: '',
        newPassword: '',
        isLoading: false,
        formClass : '',
        automaticClose: true
      },
      redirectToLogin: false,
      newItem: {
        title: '',
        isLoading: false,
        formClass : '',
        dueDate: '',
        description: '',
        automaticClose: true
      },
      newBucket:{
        name: '',
        isLoading: false,
        formClass : '',
        description: '',
        automaticClose: true
      },
      editBucket:{
        name: '',
        isLoading: false,
        formClass : '',
        description: '',
        automaticClose: true
      },
      currentBucket: {},
      buckets: []
    };

  }

  onNewBucketFormSubmit(event){
    event.preventDefault();
    let {state} = this;
    state.newBucket.formClass = 'working';
    state.newBucket.isLoading = true;
    this.setState(state);
    const {name, description} = this.state.newBucket;
    
    this.xhr.post('/bucketlists', {name: name.trim(), description: description.trim()})
    .then(response => {

      const bucket = response.data;
      
      state.buckets = [bucket, ...state.buckets];
      state.newBucket.name = '';
      state.newBucket.description = '';
  
      state.newBucket.formClass = 'succeeded';
      state.newBucket.isLoading = false;
      
      if (this.state.newBucket.automaticClose){
        this.hideForms(false);
        this.loadBucket(bucket.id);
      }
      
      if (state.buckets.length === 1){
        this.loadBucket(bucket.id);
      }

      this.setState(state);
    })
    .catch(error => {
      state.newBucket.formClass = 'failed';
      state.newBucket.isLoading = false;
      if (error.response.status === 0){
        $('#add-bucket .negative .feedback-message').text('You are offline.');
      }

      if (error.response && error.response.status === 400){
        $('#add-bucket .negative .feedback-message').text('A bucket with that name already exists.')
      }
      this.setState(state);
    });
    
  }

  onNewItemFormSubmit(event){
    event.preventDefault();
    if (!this.state.currentBucket.id){
      return;
    }

    let { state } = this;
    state.newItem.formClass = 'working';
    state.newItem.isLoading = true;
    this.setState(state);
    const {title, dueDate, description} = this.state.newItem;

    return this.xhr.post(`/bucketlists/${this.state.currentBucket.id}/items`, {
      title: title.trim(),
      "due_date": dueDate.trim(),
      description: description.trim()
    })
    .then(request => {
      const item = request.data;
      state.currentBucket.items = [item, ...state.currentBucket.items];
      state.newItem.title = '';
      state.newItem.dueDate = '';
      state.newItem.description = '';
      state.newItem.formClass = 'succeeded';
      state.newItem.isLoading = false;
      if (this.state.newItem.automaticClose){
        this.hideForms(false);
      }
      this.setState(state);
    })
    .catch(error => {
      state.newItem.formClass = 'failed';
      state.newItem.isLoading = false;
      
      if (error.response && error.response.status === 0){
        $('#add-item .negative .feedback-message').text('You are offline.');
      }

      this.setState(state);
    });
  }

  onItemDelete(id){
    return this.xhr.delete(`/bucketlists/${this.state.currentBucket.id}/items/${id}`)
    .then(() => {
      let {state} = this;
      let index = state.currentBucket.items.findIndex(item => item.id === id);
      state.currentBucket.items.splice(index, 1);
      this.setState(state);
    })
    .catch(this.errorHandler);
  }

  onItemEdit(id, data){
    return this.xhr.put(`/bucketlists/${this.state.currentBucket.id}/items/${id}`, data)
    .then(response => {
      let newItem = response.data;
      let {state} = this;
      let {currentBucket} = state;
      let {items} = currentBucket;
      
      let index = items.findIndex(item => item.id === newItem.id);
      state.currentBucket.items[index] = newItem;
      this.setState(state);
    })
    .catch(this.errorHandler);
  }

  errorHandler(error, logout = true){
    if (error.response && error.response.status === 500){
      $("#dialog.error").text("Awe snap! Something went wrong on our end. We will fix it.").fadeIn();
    }

    if (error.response && error.response.status === 401){
      if (logout){
        $("#dialog.error").text("You are not logged in.").fadeIn();
        window.localStorage.removeItem('auth');
        window.location = '/login';
      }
      
    }

    if (error.response && error.response.status === 0){
      $("#dialog.error").text("It seems you are offline. Connect to the internet and try again.").fadeIn();
    }
  }
  
  componentDidMount(){
    this.loadBuckets();
  }

  collapseSidebar(){
    $('body').removeClass('sidebar-expanded');
  }

  expandSidebar(){
    $('body').addClass('sidebar-expanded');
  }

  loadBuckets(){
    this.xhr.get('/bucketlists')
    .then(request => {
      this.setState({buckets: request.data.bucketlists});
      this.loadBucket(request.data.bucketlists[0].id);
    })
    .catch(this.errorHandler);
  }

  onNewBucketChange(event){
    let {state} = this;
    let {target} = event;
    if (target.type === "checkbox"){
      state.newBucket[target.name] = target.checked;
    } else {
      state.newBucket[target.name] = target.value;
    }
    this.setState(state);
  }

  onEditBucketChange(event){
    let {state} = this;
    let {target} = event;
    if (target.type === "checkbox"){
      state.editBucket[target.name] = target.checked;
    } else {
      state.editBucket[target.name] = target.value;
    }
    this.setState(state);
  }

  onNewItemChange(event){
    let {state} = this;
    let {target} = event;
    if (target.type === "checkbox"){
      state.newItem[target.name] = target.checked;
    } else {
      state.newItem[target.name] = target.value;
    }
    this.setState(state);
  }

  loadBucket(id){
    this.xhr.get('/bucketlists/' + id)
    .then(response => {
      let {state} = this;
      state.currentBucket = response.data.bucketlist;
      state.editBucket.name = response.data.bucketlist.name;
      state.editBucket.description = response.data.bucketlist.description;
      this.setState(state);
    })
    .catch(this.errorHandler);
  }

  toggleItem(itemId){
    
    let {state} = this;
    let {currentBucket} = state;
    let {items} = currentBucket;
    
    let index = items.findIndex(item => item.id === itemId);
    
    return this.xhr.put(`/bucketlists/${this.state.currentBucket.id}/items/${itemId}`, {
      "is_complete": !items[index].is_complete
    })
    .then(() => {
      items[index].is_complete = !items[index].is_complete;
      state.currentBucket = currentBucket;
      this.setState(state);
    })
  }

  stopPropagation(event){
    event.stopPropagation();
  }

  toggleBucketForm(event){
    event.preventDefault();
    let {state} = this;
    state.newBucket.formClass = '';
    this.setState(state)
    $('body').toggleClass('add-bucket');
  }

  toggleEditBucketForm(event){
    event.preventDefault();
    let {state} = this;
    state.editBucket.formClass = '';
    this.setState(state)
    $('body').toggleClass('edit-bucket');
  }

  toggleItemForm(event){
    event.preventDefault();
    if (!this.state.currentBucket.id){
      return;
    }

    let {state} = this;
    state.newItem.formClass = '';
    this.setState(state)
    $('body').toggleClass('add-item');
  }

  togglePasswordResetForm(event){
    event.preventDefault();
    $('body').toggleClass('password-reset');
  }

  logout(){
    return this.xhr.post('/auth/logout')
    .then(() => {
      localStorage.removeItem('auth');
      let {state} = this;
      state.redirectToLogin = true;
      this.setState(state); 
    })
    .catch(this.errorHandler);
  }

  hideForms(event){
    if (event){
      event.preventDefault();
    }
    $('body').removeClass('add-bucket');
    $('body').removeClass('edit-bucket');
    $('body').removeClass('add-item');
    $('body').removeClass('password-reset');
  }

  onBucketItemClick(id){
    
    if (id === this.state.currentBucket.id){
      return;
    }
    
    this.loadBucket(id);
  }

  onEditBucketFormSubmit(event){
    event.preventDefault();
    if (!this.state.currentBucket.id){
      return;
    }

    let {state} = this;
    state.editBucket.formClass = 'working';
    state.editBucket.isLoading = true;
    this.setState(state);

    let {name, description} = this.state.editBucket;
    
    this.xhr.put('/bucketlists/' + this.state.currentBucket.id, {name: name.trim(), description: description.trim()})
    .then(request => {
      state.currentBucket = {...state.currentBucket, ...request.data.items};
      state.editBucket.name = request.data.name;
      state.editBucket.description = request.data.description;
      state.editBucket.formClass = 'succeeded';
      state.editBucket.isLoading = false;

      let index = state.buckets.findIndex(bucket => bucket.id === request.data.id);

      state.buckets[index].name = request.data.name;
      state.buckets[index].description = request.data.description;

      if (this.state.editBucket.automaticClose){
        this.hideForms(false);
      }

      this.setState(state);
    })
    .catch(error => {
      // handle error appropriately
      state.editBucket.formClass = 'failed';
      state.editBucket.isLoading = false;

      if (error.response && error.response.status === 400){
        $('#edit-bucket .negative .feedback-message').text('A bucket with that name already exists.')
      }

      this.errorHandler(error);
      this.setState(state);
    });
  }

  onBucketDeleteClick(event){
    event.preventDefault();
    if (!this.state.currentBucket.id){
      return;
    }

    return this.xhr.delete(`/bucketlists/${this.state.currentBucket.id}`)
    .then(result => {
      this.removeBucket(result.data.id);
    })
  }

  // removes bucket from state
  removeBucket(id){
    let {state} = this;
    let index = state.buckets.findIndex(bucket => bucket.id === id);
    state.buckets.splice(index, 1);
    state.currentBucket = {};
    this.setState(state);
    let size = this.state.buckets.length;

    if (size > 0){
      let [nextBucket] = this.state.buckets;
      this.loadBucket(nextBucket.id);
    }
  }

  onPasswordResetChange(event){
    let {state} = this;
    let {target} = event;
    if (target.type === "checkbox"){
      state.resetPassword[target.name] = target.checked;
    } else {
      state.resetPassword[target.name] = target.value;
    }
    
    this.setState(state);
  }

  // displays goals in the current bucket
  renderItems(){
    let {items} = this.state.currentBucket;

    if (this.state.buckets.length === 0){
      return (
        <div className="no-items">
          <a className="quick-action" onClick={this.toggleBucketForm}>Create a new bucket</a>
        </div>
      );
    }

    if (!items){
      return (
        <div className="no-items">
          <p>Select a bucket.</p>
        </div>
      );
    }

    if (items.length === 0){
      return (
        <div className="no-items">
          <a className="quick-action" onClick={this.toggleItemForm.bind(this)}>Create a new goal.</a>
        </div>
      );
    }

    return items.map(item => {
      return (
        <BucketItem key={item.id}
          id={item.id}
          title={item.title} 
          description={item.description}
          dueDate={item.due_date}
          isComplete={item.is_complete}
          createdAt={item.created_at}
          toggleItem={this.toggleItem}
          onItemEdit={this.onItemEdit.bind(this)}
          onItemDelete={this.onItemDelete} />
      );
    });
  }

  resetPassword(event){
    event.preventDefault();
    let self = this;
    let {state} = self;
    state.resetPassword.formClass = 'working';
    state.resetPassword.isLoading = true;
    this.setState(state);
    let {oldPassword, newPassword, newPasswordRepeat} = this.state.resetPassword;

    if (newPasswordRepeat !== newPassword){
      $('#password-reset .negative .feedback-message').text('Password mismatch.');
      state.resetPassword.formClass = 'failed';
      state.resetPassword.isLoading = false;
      self.setState(state);
      return;
    }

    if (newPassword.length < 8){
      $('#password-reset .negative .feedback-message').text('Password should be at least 8 characters long.');
      state.resetPassword.formClass = 'failed';
      state.resetPassword.isLoading = false;
      self.setState(state);
      return;
    }

    return this.xhr.post('/auth/reset-password', {
      new_password: newPassword,
      old_password: oldPassword
    })
    .then(response => {
      state.resetPassword.formClass = 'succeeded';
      state.resetPassword.isLoading = false;
      state.resetPassword.oldPassword = '';
      state.resetPassword.newPassword = '';
      state.resetPassword.newPasswordRepeat = '';
      if (this.state.resetPassword.automaticClose){
        this.hideForms(false);
      }
      this.setState(state);
    })
    .catch(error => {
      state.resetPassword.formClass = 'failed';
      state.resetPassword.isLoading = false;

      this.errorHandler(error, false);

      if (error.response && error.response.status === 401){
        $('#password-reset .negative .feedback-message').text('Invalid old password.')
      }
      
      self.setState(state);
    });
  }

  onSearchChange(event){
    let {state} = this;
    state.search = event.target.value;
    this.setState(state);
  }

  toggleSearch(event){
    event.preventDefault();
    
    this.setState(prevState => {
      return {
        showSearch: !prevState.showSearch,
        searchResults: [],
        search: '',
        showSearchResults: false
      }
    });
  }

  onSearchKeyDown = (event) => {
    if (event.keyCode === 13){
      event.preventDefault();

      if (!this.state.currentBucket.id || this.state.search.trim() === ''){
        return;
      }

      let search = this.state.search;
      let {state} = this;
      state.isSearching = true;
      state.showSearchResults = false;
      state.prevSearchTerm = state.search;
      state.search = '';
      this.setState(state);

      

      // get search results 
      this.xhr.get(`/bucketlists/${this.state.currentBucket.id}?q=${search}`)
      .then(({data}) => {
        state.searchResults = data.bucketlist.items;
        state.showSearchResults = true;
        state.isSearching = false;
        this.setState(state);
      })
      .catch(error => {
        
      })
    }
  }

  render() {

    if (!this.auth || !this.auth.token || this.state.redirectToLogin) {
      return <Redirect to="/login" />;
    }

    let firstName = this.auth.user.first_name,
    lastName = this.auth.user.last_name;

    let items = this.renderItems();

    return (
      <div id="web-container">
        <div id="top-bar">
          <BucketListHeader currentBucket = {this.state.currentBucket}
                            toggleItemForm = {this.toggleItemForm.bind(this)}
                            toggleEditBucketForm = {this.toggleEditBucketForm.bind(this)}
                            onBucketDeleteClick = {this.onBucketDeleteClick.bind(this)} />
        </div>
        <div id="portal-main">
            <div id="sidebar" className="expanded">
               <div id="dashboard-menu">
                 <div id="menu-wrapper">
                  <div className="d-menu-item list-header">
                    <div className="menu-icon">
                      <i className="glyphicon glyphicon-user"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">{firstName} {lastName}</span>
                    </div>
                    <div className="clearfix"></div>
                  </div>
                  <a className="d-menu-item current">
                    <div className="menu-icon">
                      <img src={bucketIconLight} alt="Bucket icon"/>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Bucketlists</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                  <a className="d-menu-item" onClick={this.toggleSearch}>
                    <div className="menu-icon">
                      <i className="glyphicon glyphicon-search"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Search</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                   <a onClick={this.togglePasswordResetForm} className="d-menu-item">
                    <div className="menu-icon">
                      <i className="glyphicon glyphicon-cog"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Reset password</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                   <a onClick={this.logout.bind(this)} className="d-menu-item">
                    <div className="menu-icon">
                      <i className="glyphicon glyphicon-off"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Logout</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                  <a className="d-menu-item collapse" onClick={this.collapseSidebar}>
                    <div className="menu-icon">
                      <i className="glyphicon glyphicon-chevron-left"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Collapse</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                  <a className="d-menu-item expand" onClick={this.expandSidebar}>
                    <div id="profile-pic-wrapper" className="menu-icon">
                      <i className="glyphicon glyphicon-chevron-right"></i>
                    </div>
                    <div id="user-details" className="menu-text">
                      <span className="ellipsable">Expand</span>
                    </div>
                    <div className="clearfix"></div>
                  </a>
                 </div>
               </div>
               <div id="bucket-list">
                 <div id="header-buckets">
                   <span className="bucket-title uppercase">My buckets</span>
                   <button onClick={this.toggleBucketForm} id="action-add-bucket" className="right">
                     <i className="glyphicon glyphicon-plus"></i>
                     <span className="">Create a bucket</span>
                   </button> 
                   <div className="clearfix"></div>
                 </div>
                 <div id="bucket-list-wrapper">
                   <BucketList onItemClick={this.onBucketItemClick} 
                    buckets={this.state.buckets} 
                    currentBucketId={this.state.currentBucket.id}/>
                 </div>
               </div>
            </div>
            <main>
              <div id="main-content">
                <div id="the-content">
                  <div id="bucket-items" className="left">
                    {items}
                  </div>
                  <div className="clearfix"></div>
                </div>
              </div>
            </main>
        </div>
        <div id="overlay" onClick={this.hideForms}>
          <div id="overlay-inner">
            <div id="add-bucket" className="overlay-content" onClick={this.stopPropagation}>
              <NewBucketForm onSubmit={this.onNewBucketFormSubmit}
                             onChange={this.onNewBucketChange}
                             name={this.state.newBucket.name}
                             description={this.state.newBucket.description}
                             formClass={this.state.newBucket.formClass}
                             isDisabled={this.state.newBucket.isLoading}
                             close={this.toggleBucketForm}
                             automaticClose={this.state.newBucket.automaticClose} />
            </div>
            <div id="edit-bucket" className="overlay-content" onClick={this.stopPropagation}>
              <EditBucketForm onSubmit={this.onEditBucketFormSubmit.bind(this)}
                              onChange={this.onEditBucketChange.bind(this)}
                              name={this.state.editBucket.name}
                              description={this.state.editBucket.description}
                              formClass={this.state.editBucket.formClass}
                              isDisabled={this.state.editBucket.isLoading}
                              close={this.toggleEditBucketForm.bind(this)}
                              bucketName={this.state.currentBucket.name}
                             automaticClose={this.state.editBucket.automaticClose} />
            </div>
            <div id="add-item" className="overlay-content" onClick={this.stopPropagation}>
              <NewItemForm onSubmit={this.onNewItemFormSubmit}
                           onChange={this.onNewItemChange}
                           title={this.state.newItem.title}
                           description={this.state.newItem.description}
                           dueDate={this.state.newItem.dueDate}
                           formClass={this.state.newItem.formClass}
                           isDisabled={this.state.newItem.isLoading}
                           close={this.toggleItemForm.bind(this)}
                           bucketName={this.state.currentBucket.name}
                           automaticClose={this.state.newItem.automaticClose} />
            </div>
            <div id="password-reset" className="overlay-content" onClick={this.stopPropagation}>
              <ResetPasswordForm onSubmit={this.resetPassword.bind(this)}
                                 onChange={this.onPasswordResetChange.bind(this)}
                                 oldPassword={this.state.resetPassword.oldPasword}
                                 newPassword={this.state.resetPassword.newPasword}
                                 newPasswordRepeat={this.state.resetPassword.newPaswordRepeat}
                                 formClass={this.state.resetPassword.formClass}
                                 isDisabled={this.state.resetPassword.isLoading}
                                 close={this.togglePasswordResetForm.bind(this)}
                                 automaticClose={this.state.resetPassword.automaticClose}
                                  />
            </div>
          </div>
        </div>
        {this.state.showSearch? 
            <Search onChange={this.onSearchChange} 
                  onKeyDown={this.onSearchKeyDown}
                  search={this.state.search}
                  onClose={this.toggleSearch}
                  bucketName={this.state.currentBucket.name}
                  results={this.state.searchResults}
                  showResults={this.state.showSearchResults}
                  isSearching={this.state.isSearching}
                  prevSearchTerm={this.state.prevSearchTerm} /> : null}
    </div>
    );
  }
}
