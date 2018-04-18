import React from "react";
import { Checkbox } from "office-ui-fabric-react";

const Task = props => {
  return (
    <Checkbox
      label={props.task.title}
      onChange={(event, isChecked) => props.onChange(props.task, isChecked)}
    />
  );
};

export default Task;
