import React, { useRef } from "react";
import { Checkbox, Icon, Link } from "office-ui-fabric-react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "./ItemTypes";

const Task = (props) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = props.index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle

      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      props.onMoveTask(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: ItemTypes.CARD, id: props.task._id, index: props.index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <li className="Task-listitem">
        <Checkbox
          className="Task-checkbox"
          onChange={(event, isChecked) =>
            props.onCheckedChange(props.task, isChecked)
          }
        />
        <span className="Task-title">
          <div>{props.task.title}</div>
        </span>
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
        {props.inTeams && props.supportsConversation && (
          <Link className="Task-conversation-link">
            {props.task.conversationOpen ? (
              <Icon
                className="Task-conversation-open-icon"
                iconName="ChatSolid"
                onClick={(event) => props.closeConversation(props.task)}
              />
            ) : (
              <Icon
                className="Task-conversation-closed-icon"
                iconName="Chat"
                onClick={(event) => props.openConversation(props.task)}
              />
            )}
          </Link>
        )}
      </li>
    </div>
  );

  /*
  return (
    <li
      className="Task-listitem"
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Checkbox
        className="Task-checkbox"
        onChange={(event, isChecked) =>
          props.onCheckedChange(props.task, isChecked)
        }
      />
      <span className="Task-title">
        <div>{props.task.title}</div>
      </span>
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
      {props.inTeams && props.supportsConversation && (
        <Link className="Task-conversation-link">
          {props.task.conversationOpen ? (
            <Icon
              className="Task-conversation-open-icon"
              iconName="ChatSolid"
              onClick={(event) => props.closeConversation(props.task)}
            />
          ) : (
            <Icon
              className="Task-conversation-closed-icon"
              iconName="Chat"
              onClick={(event) => props.openConversation(props.task)}
            />
          )}
        </Link>
      )}
    </li>
  );
  */
};

export default Task;
