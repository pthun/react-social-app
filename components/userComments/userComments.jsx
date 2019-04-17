import React from 'react';
import {
  Link
} from 'react-router-dom';
import './userComments.css';

import axios from 'axios';

class UserComments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userComments: [],
      user: {},
      loading: true, //To wait while modeldata is fetching
    }

    this.populateState = this.populateState.bind(this);
    this.createCommentHTML = this.createCommentHTML.bind(this);

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
    const commentsPromise = axios.get('/commentsOfUser/' + this.props.match.params.userId);

    Promise.all([userPromise, commentsPromise]).then(values => {
      this.setState({userComments: values[1].data, user: values[0].data, loading: false});
      this.props.topBarCallback('Comments by ' + values[0].data.first_name + ' ' + values[0].data.last_name);
    }, values => {
      console.log(values);
    })
  }

  componentWillUnmount() {
    this.props.topBarCallback('Home'); 
  }

  createCommentHTML() {
    console.log(this.state.userComments);
    const userComments = [];
    this.state.userComments.forEach((elem, index) => userComments.push(
      <Link to={"/photos/" + elem.user_id + "/" + elem.photo_id} key={index}>
        <li className="collection-item avatar">
          <img src={"images/" + elem.photo_file_name} alt="" className="circle imagefit"/>
          <span className="title cs142-main-bold black-text">Posted on {elem.date_time}:</span>
          <p className="black-text">{elem.comment}</p>
        </li>
      </Link>
    ));
    return (
      <ul className="collection">
        {userComments}
      </ul>
    )
  }

  render() {
    console.log("in render");
    return (
      this.state.loading ||
      <div className="col s10 offset-s1">
        <div className="section">
          <h4>Comments for {this.state.user.first_name + ' ' + this.state.user.last_name}</h4>
        </div>
        <div className="row">
          {this.state.userComments && this.createCommentHTML()}
        </div>
      </div>
    );
  }
}

export default UserComments;