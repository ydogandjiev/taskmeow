import React, { useState, useEffect } from "react";
import UserTile from "./UserTile";
import authService from "../services/auth.service";
import * as microsoftTeams from "@microsoft/teams-js";
import {
  Label,
  TextField,
  PrimaryButton,
  Spinner,
} from "office-ui-fabric-react";

/**
 * This component is responsible for:
 * 1. Creating a new task
 */
const Create = (props) => {
  const [task, setTask] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    microsoftTeams.initialize();
    authService
      .getUser()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.warn(`Error getting user: ${err}`);
        setLoading(false);
      });
  });

  const handleTextChange = (ev, value) => {
    setTask({ ...task, title: value });
  };

  const saveTask = () => {
    microsoftTeams.tasks.submitTask(
      {
        title: task.title,
      },
      props.appId
    );
  };

  return (
    <div className="App-content">
      <div className="App-header">
        <h1 className="App-header-title">Create</h1>
        <UserTile history={props.history} />
      </div>
      <div>
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="task-field">
              <Label>Title</Label>
              <TextField
                className="Tasks-add-textfield"
                placeholder="New Task"
                value={task.title}
                onChange={handleTextChange}
              />
            </div>

            <div className="create-section">
              <PrimaryButton
                disabled={!task.title}
                onClick={saveTask}
                text="Save"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Create;
