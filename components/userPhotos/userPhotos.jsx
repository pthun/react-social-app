import React from 'react';
import {
  Link, HashRouter, Route, Switch
} from 'react-router-dom';
import './userPhotos.css';

import axios from 'axios';

/**
 * Define UserPhotos, a React componment of CS142 project #5
 * Note that due to the way we define the router, all url elements after the 
 * match are ignored, but they show up in this.props.match.location
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userPhotos: [],
      user: {},
      loading: true, //To wait while modeldata is fetching
    }

    this.createPrevNextHTML = this.createPrevNextHTML.bind(this);
    this.populateState = this.populateState.bind(this);

  }

  componentDidMount() {
    this.populateState();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.match.params.userId !== prevProps.match.params.userId) {
      this.populateState();
    }
  } 

  populateState() {
    const userPromise = axios.get('/user/' + this.props.match.params.userId);
    const photoPromise = axios.get('/photosOfUser/' + this.props.match.params.userId);

    Promise.all([userPromise, photoPromise]).then(values => {
      this.setState({userPhotos: values[1].data, user: values[0].data, loading: false});
      this.props.topBarCallback('Photos shared by ' + values[0].data.first_name + ' ' + values[0].data.last_name);
    }, values => {
      console.log(values);
    })
  }

  componentWillUnmount() {
    this.props.topBarCallback('Home'); 
  }

  createPhotoHTML() {
    const userPhotos = [];
    this.state.userPhotos.forEach(elem => userPhotos.push(
      <div className="col s12" key={elem._id}>
        <div className="card z-depth-2">
          <div className="card-image">
            <img src={"images/" + elem.file_name}/>
          </div>
          <div className="card-content">
            <div className="cs142-main-photo">Photo posted on {elem.date_time}
            </div>
            <div className="cs142-main-padded cs142-main-border">
              {elem.comments && this.createCommentHTML(elem.comments)}
            </div>
          </div>
        </div>
      </div>
    ));
    return userPhotos;
  }

  createCommentHTML(comments) {
    const photoComments = [];
    comments.forEach(elem => photoComments.push(
      <div key={elem._id}>
        <div className="cs142-main-bold">Comment posted by <Link to={"/users/" + elem.user._id}>{elem.user.first_name} {elem.user.last_name}
          </Link> - {elem.date_time}</div>
        <div className="cs142-main-comment">{elem.comment}</div>
      </div>
    ));
    return photoComments;
  }

  createPrevNextHTML() {
    let indices = this.state.userPhotos.map(elem => elem._id);
    console.log(indices);
    let cur;
    if (this.props.location.pathname === this.props.match.url) {
      cur = 0;
    } else {
      let id = this.props.location.pathname.substring(this.props.match.url.length + 1);
      console.log(id);
      cur = indices.findIndex(elem => (id === elem));
    }
    console.log("Test");
    console.log(cur);
    /* This will eliminate any non-numbers as well as any out-of-bounds numbers */
    if (!this.state.userPhotos[cur]) {
      console.log("here");
      return null;
    }
    let prevLink, nextLink;

    /* Set up the prev link */
    if (cur === 0) {
      prevLink = <span className="grey-text">Prev</span>
    } else {
      prevLink = <Link to={this.props.match.url + "/" + indices[cur - 1]}>Prev</Link>
    }
    /* Set up the next link */
    if (cur === (this.state.userPhotos.length - 1)) {
      nextLink = <span className="grey-text">Next</span>
    } else {
      nextLink = <Link to={this.props.match.url + "/" + indices[cur + 1]}>Next</Link>
    }

    return (
      <p className="right-align inline-block">{"\< "}{prevLink}{" \| "}{nextLink}{" \>"}</p>
    )
  }

  /* This is the alternative render for extra credit in project 5 */
  renderAdvanced() {
    return (
      this.state.loading ||
      <div className="col s10 offset-s1">
        <div className="section flexline">
          <h4 className="inline-block">Photos for {this.state.user.first_name + ' ' + this.state.user.last_name}</h4>
          {this.createPrevNextHTML()}
        </div>
        <div className="row">
          <Switch>
            <Route path={this.props.match.path + "/:photo"} render={ props => {
              /* This callback provides the photo unless the user is out of bounds */
              if (this.state.userPhotos.filter(elem => (elem._id === props.match.params.photo)).length) {
                return this.createPhotoHTML()[this.state.userPhotos.findIndex(elem => (elem._id === props.match.params.photo))];
              } else {
                return <div className="col s12">This photo does not exist. Click <Link to={this.props.match.url}>here</Link> for initial photo</div>
              }
            }}/>
            <Route path={this.props.match.path} render={ props => (this.state.userPhotos && this.createPhotoHTML()[0]) }/>
          </Switch>
        </div>
      </div>
    );
  }

  /* This is the default render in project 5 */
  renderBasic() {
    return (
      this.state.loading ||
      <div className="col s10 offset-s1">
        <div className="section">
          <h4>Photos for {this.state.user.first_name + ' ' + this.state.user.last_name}</h4>
        </div>
        <div className="row">
          {this.state.userPhotos && this.createPhotoHTML()}
        </div>
      </div>
    );
  }

  render() {
    return (
      this.props.advancedFeatures ? this.renderAdvanced() : this.renderBasic() 
    );
  }
}

export default UserPhotos;
