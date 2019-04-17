import React from 'react';
import {
  Link
} from 'react-router-dom';
import './userList.css';

import axios from 'axios';


/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
    }

    this.getUsers = this.getUsers.bind(this);
  }

  componentDidMount() {
    this.getUsers();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.advancedFeatures !== prevProps.advancedFeatures) {
      this.getUsers();
    }
  }

  getUsers() {
    axios.get('/user/list').then(r => {
      const users = r.data;
      if (this.props.advancedFeatures) {
        /* If advanced features activated, get the stats for each user */
        const statsPromises = [];
        users.forEach(user => {
          statsPromises.push(axios.get('/user/stats/' + user._id));
        });
        Promise.all(statsPromises).then(values => {
          users.forEach((user, i) => {
            user.photoCount = values[i].data.photoCount;
            user.commentCount = values[i].data.commentCount;
          }, value => {
            console.log(values);
          });
          this.setState({users: users});
        });
      } else {
        this.setState({users: users});
      }
    }, r => {
      console.log(r.statusText)
    })
  }

  render() {
    const userList = [];
    this.state.users.forEach(elem => userList.push(
      <div className="collection-item transparent" key={elem._id}>
        <Link to={"/users/" + elem._id} className="pink-text text-darken-2">
          {elem.first_name} {elem.last_name}
        </Link>
        {this.props.advancedFeatures && <Link to={"/comments/" + elem._id}>
          <span className="red new badge" data-badge-caption="">{elem.commentCount}</span>
        </Link>}
        {this.props.advancedFeatures && <Link to={"/photos/" + elem._id}>
          <span className="green new badge" data-badge-caption="">{elem.photoCount}</span>
        </Link>}
      </div>
    ));
    return (
      <div className="collection with-header">
        <ul className="nomargin">
          <li className="collection-header transparent"><h4>Available Users</h4></li>
          {userList}
        </ul>
      </div>
    );
  }
}

export default UserList;
