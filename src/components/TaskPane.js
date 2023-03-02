import React, { useEffect, useState } from "react";
import {
  Checkbox,
  Icon,
  IconButton,
  Link,
  Label,
  TextField,
  PrimaryButton,
  DefaultButton,
  Spinner,
} from "office-ui-fabric-react";
import { ConsentConsumer } from "./ConsentContext";
import UserTile from "./UserTile";
import tasksService from "../services/tasks.service";
import { baseUrl } from "./utils";
import * as microsoftTeams from "@microsoft/teams-js";

const groupShareMessage =
  "Group tasks cannot be shared outside this channel or chat.";
const privateShareErrorMessage = "This task cannot be shared by you.";

const TaskPane = (props) => {
  const {
    history,
    isGroupRoute,
    taskId,
    shareTag,
    inTeams,
    taskList,
    isListLoading,
    supportsConversation,
    openConversation,
    closeConversation,
    onCloseTask,
    saveEditToListItem,
  } = props;
  const [complete, setComplete] = useState(false);
  const [changed, setChanged] = useState(false);
  const [activeTask, setActiveTask] = useState(undefined);
  const [isListItem, setIsListItem] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState(
    isGroupRoute ? groupShareMessage : ""
  );

  useEffect(() => {
    if (!activeTask) {
      if (!taskId) {
        setLoading(false);
        return;
      }

      if (!isListLoading && taskList && taskList.length) {
        let foundTask = taskList.find((t) => t._id === taskId);
        if (foundTask) {
          setActiveTask(foundTask);
          setLoading(false);
          return;
        }
      }

      if (!shareTag) {
        setLoading(false);
        return;
      }

      tasksService
        .get(undefined, { taskId, shareTag })
        .then((task) => {
          setActiveTask(task);
          setIsListItem(false);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [activeTask, taskId, shareTag, taskList, isListLoading]);

  const handleCompletionToggle = (ev, isChecked) => {
    setComplete(isChecked);
    setChanged(true);
  };

  const handleStarredChange = (isStarred) => {
    setActiveTask({ ...activeTask, starred: isStarred });
    setChanged(true);
  };

  const handleTextChange = (ev, value) => {
    setActiveTask({ ...activeTask, title: value });
    setChanged(true);
  };

  const saveTask = () => {
    if (complete) {
      tasksService.destroy(activeTask._id).then(() => {
        onCloseTask(true);
      });
    } else {
      saveEdit();
    }
  };

  const saveEdit = () => {
    if (isListItem) {
      saveEditToListItem(activeTask);
    } else {
      tasksService.update(activeTask);
    }
  };

  const share = () => {
    if (isGroupRoute && isListItem) {
      const url = `${baseUrl}/group?task=${activeTask._id}`;
      microsoftTeams.sharing.shareWebContent(
        {
          content: [
            {
              type: "URL",
              url,
              preview: true,
            },
          ],
        },
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    } else if (activeTask.user) {
      setShareMessage("");
      tasksService
        .getShareUrl(activeTask._id)
        .then((url) => {
          if (url) {
            microsoftTeams.sharing.shareWebContent(
              {
                content: [
                  {
                    type: "URL",
                    url,
                    preview: true,
                  },
                ],
              },
              (err) => {
                if (err) {
                  setShareMessage(err.message);
                }
              }
            );
          } else {
            setShareMessage(privateShareErrorMessage);
          }
        })
        .catch((err) => {
          setShareMessage(err.message);
        });
    }
  };

  return (
    <div className="Task-pane">
      <div className="App-header">
        <h1 className="App-header-title">
          <IconButton
            onClick={() => onCloseTask()}
            title="Back to list"
            iconProps={{
              iconName: "DoubleChevronLeft8",
            }}
          />
          <span>&nbsp;Task</span>
        </h1>
        <ConsentConsumer>
          {({ setConsentRequired }) => (
            <UserTile
              history={history}
              setConsentRequired={setConsentRequired}
            />
          )}
        </ConsentConsumer>
      </div>
      {loading ? (
        <Spinner label="Loading task..." />
      ) : (
        <div>
          {activeTask ? (
            <div>
              {!isListItem && <p>You are viewing a shared task.</p>}
              <div className="task-field">
                <Label>Title</Label>
                <TextField
                  className="Tasks-add-textfield"
                  placeholder="New Task"
                  value={activeTask.title}
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
                  {activeTask.starred ? (
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

              {inTeams && supportsConversation && isGroupRoute && isListItem && (
                <div className="task-field">
                  <Label>Chat</Label>
                  <Link className="Task-conversation-link">
                    {activeTask.conversationOpen ? (
                      <Icon
                        className="Task-conversation-open-icon"
                        iconName="ChatSolid"
                        onClick={() => closeConversation(activeTask)}
                      />
                    ) : (
                      <Icon
                        className="Task-conversation-closed-icon"
                        iconName="Chat"
                        onClick={() => openConversation(activeTask)}
                      />
                    )}
                  </Link>
                </div>
              )}
              {inTeams && (
                <div className="task-field">
                  <DefaultButton
                    onClick={share}
                    text={inTeams ? "Share in Teams" : "Share to Teams"}
                  />
                  <p>{shareMessage}</p>
                </div>
              )}
              <div className="task-field">
                <PrimaryButton
                  disabled={!changed}
                  onClick={saveTask}
                  text="Save"
                />
              </div>
            </div>
          ) : (
            <p>
              This task is either unavailable, or you do not have access to it.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskPane;
