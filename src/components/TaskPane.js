import React from "react";
import { Checkbox, Button, Icon, Link, Label } from "office-ui-fabric-react";

const TaskPane = (props) => {
  return (
    <div clasName="Task-pane">
      <Link className="back-link" onClick={props.close}>
        Back to list
      </Link>

      <div className="task-field">
        <Label>Completed</Label>
        <Checkbox
          className="Task-checkbox"
          onChange={(event, isChecked) =>
            props.onCheckedChange(props.task, isChecked)
          }
        />
      </div>
      <div className="task-field">
        <Label>Favorited</Label>
        <Link className="Task-star-link">
          {props.task.starred ? (
            <Icon
              className="Task-starred-icon"
              iconName="FavoriteStarFill"
              onClick={(event) => props.onStarredChange(props.task, false)}
            />
          ) : (
            <Icon
              className="Task-unstarred-icon"
              iconName="FavoriteStar"
              onClick={(event) => props.onStarredChange(props.task, true)}
            />
          )}
        </Link>
      </div>
      <div className="task-field">
        <Label>Placeholder for task details</Label>
      </div>

      {props.inTeams && props.supportsConversation && (
        <div className="task-field">
          <Label>Chat</Label>
          <Link className="Task-conversation-link">
            {props.task.conversationOpen ? (
              <Icon
                className="Task-conversation-open-icon"
                iconName="ChatSolid"
                onClick={() => props.closeConversation(props.task)}
              />
            ) : (
              <Icon
                className="Task-conversation-closed-icon"
                iconName="Chat"
                onClick={() => props.openConversation(props.task)}
              />
            )}
          </Link>
        </div>
      )}
      <div className="task-field">
        <Button onClick={() => props.share(props.task)}>
          {props.inTeams ? "Share in Teams" : "Share to Teams"}
        </Button>
      </div>
    </div>
  );
};

export default TaskPane;
