import React from 'react';
import '../css/search.min.css';
import '../css/bucket-item.min.css';
import BucketItem from './BucketItem';
import loadingIcon from '../images/loading.gif';

const Search = props => {

    const results = props.results.map(item => {
        return <BucketItem key={item.id}
          id={item.id}
          title={item.title} 
          description={item.description}
          dueDate={item.due_date}
          isComplete={item.is_complete}
          createdAt={item.created_at}
          toggleItem={() => {}}
          onItemEdit={() => {}}
          onItemDelete={() => {}} />
    });

    const showContent = () => {
        if (props.results.length === 0 && props.showResults){
            return <div>
                <span className="search-results-title">Search results for <span className="search-term">{props.prevSearchTerm}</span></span>
                <div className="results">
                    <span className="no-content">No items matched the search.</span>
                </div>
            </div>
        }
        if (props.showResults){
            return <div>
                <span className="search-results-title">Search results for <span className="search-term">{props.prevSearchTerm}</span></span>
                <div className="results">
                    {results}
                </div>
            </div>
        }

        if (props.isSearching){
            return <div className="spinner-wrapper">
                <span className="spinner">
                    <img src={loadingIcon} alt="loading" />
                </span>
            </div>
        }
        return '';
    }

    return (
        <div id="search">
            <div id="search-content">
                <span className="close" onClick={props.onClose}>
                    <svg viewBox="0 0 24 24" version="1.1"><title>Close icon</title><g><polygon points="22 0 24 2 2 24 0 22"></polygon><polygon transform="translate(12, 12) scale(-1, 1) translate(-12, -12) " points="22 0 24 2 2 24 0 22"></polygon></g></svg>
                </span>
                <div className="container">
                    <div className="search-title">
                        <span>Search - {props.bucketName}</span>
                    </div>
                    <textarea onKeyDown={props.onKeyDown} onChange={props.onChange} value={props.search} name="search" autoFocus></textarea>
                </div>
                <div className="search-results">
                    <div className="container">
                        {showContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;
