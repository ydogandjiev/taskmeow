import React, { useState } from "react";
import {
  Checkbox,
  Icon,
  Link,
  Label,
  TextField,
  PrimaryButton,
  DefaultButton,
} from "office-ui-fabric-react";

const TaskPane = (props) => {
  const {
    task,
    inTeams,
    supportsConversation,
    isGroupTask,
    saveEdit,
    onSaveTaskComplete,
    share,
    openConversation,
    closeConversation,
  } = props;
  const [complete, setComplete] = useState(false);
  const [starred, setStarred] = useState(task.starred);
  const [title, setTitle] = useState(task.title);
  const [changed, setChanged] = useState(false);

  const handleCompletionToggle = (ev, isChecked) => {
    setComplete(isChecked);
    setChanged(true);
  };

  const handleStarredChange = (isStarred) => {
    setStarred(isStarred);
    setChanged(true);
  };

  const handleTextChange = (ev, value) => {
    setTitle(value);
    setChanged(true);
  };

  const saveTask = () => {
    if (complete) {
      onSaveTaskComplete(task);
    } else {
      saveEdit({ ...task, title, starred });
    }
  };

  return (
    <div className="Task-pane">
      <div className="task-field">
        <Label>Title</Label>
        <TextField
          className="Tasks-add-textfield"
          placeholder="New Task"
          value={title}
          onChange={handleTextChange}
        />
      </div>
      <div className="task-field">
        <Label>Completed</Label>
        <Checkbox
          className="Task-checkbox"
          value={complete}
          onChange={handleCompletionToggle}
        />
      </div>
      <div className="task-field">
        <Label>Favorited</Label>
        <Link className="Task-star-link">
          {starred ? (
            <Icon
              className="Task-starred-icon"
              iconName="FavoriteStarFill"
              onClick={() => handleStarredChange(false)}
            />
          ) : (
            <Icon
              className="Task-unstarred-icon"
              iconName="FavoriteStar"
              onClick={() => handleStarredChange(true)}
            />
          )}
        </Link>
      </div>

      {inTeams && supportsConversation && isGroupTask && (
        <div className="task-field">
          <Label>Chat</Label>
          <Link className="Task-conversation-link">
            {task.conversationOpen ? (
              <Icon
                className="Task-conversation-open-icon"
                iconName="ChatSolid"
                onClick={() => closeConversation(task)}
              />
            ) : (
              <Icon
                className="Task-conversation-closed-icon"
                iconName="Chat"
                onClick={() => openConversation(task)}
              />
            )}
          </Link>
        </div>
      )}
      {inTeams && isGroupTask && (
        <div className="task-field">
          <DefaultButton
            onClick={() => share(task)}
            text={inTeams ? "Share in Teams" : "Share to Teams"}
          />
        </div>
      )}
      <div className="task-field">
        <PrimaryButton disabled={!changed} onClick={saveTask} text="Save" />
      </div>
    </div>
  );
};

export default TaskPane;
