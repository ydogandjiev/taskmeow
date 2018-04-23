import React from "react";
import { Checkbox, Icon, Link } from "office-ui-fabric-react";

const Task = props => {
  return (
    <li className="Task-listitem">
      <Checkbox
        className="Task-checkbox"
        label={props.task.title}
        onChange={(event, isChecked) =>
          props.onCheckedChange(props.task, isChecked)
        }
      />
      <Link className="Task-starlink">
        {props.task.starred ? (
          <Icon
            className="Task-starred-icon"
            iconName="FavoriteStarFill"
            onClick={event => props.onStarredChange(props.task, false)}
          />
        ) : (
          <Icon
            className="Task-unstarred-icon"
            iconName="FavoriteStar"
            onClick={event => props.onStarredChange(props.task, true)}
          />
        )}
      </Link>
    </li>
  );
};

export default Task;
