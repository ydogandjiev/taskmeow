import React from "react";
import { Checkbox, Icon, Link } from "office-ui-fabric-react";
import { Draggable } from "react-beautiful-dnd";

const Task = props => {
  return (
    <Draggable draggableId={props.task._id} index={props.index}>
      {(provided, snapshot) => (
        <li
          className="Task-listitem"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Checkbox
            className="Task-checkbox"
            onChange={(event, isChecked) =>
              props.onCheckedChange(props.task, isChecked)
            }
          />
          <span className="Task-title">{props.task.title}</span>
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
      )}
    </Draggable>
  );
};

export default Task;
