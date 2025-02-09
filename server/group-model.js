import { Schema, model } from "mongoose";

const groupSchema = new Schema({
  threadId: { type: String, required: true, unique: true },
  serviceUrl: { type: String, required: true },
});

const Group = model("Group", groupSchema);
export default Group;
