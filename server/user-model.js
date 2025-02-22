import { Schema, model } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  accounts: [{ uid: String, provider: String }],
});

const User = model("User", userSchema);
export default User;
