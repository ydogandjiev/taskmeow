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
import * as microsoftTeams from "@microsoft/teams-js";
import { getBaseUrl } from "./utils";

const groupShareMessage =
  "Group tasks cannot be shared outside this channel or chat.";
const privateShareErrorMessage = "This task cannot be shared by you.";

const TaskPane = (props) => {
  const {
    history,
    isGroupRoute,
    taskId,
    threadId,
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
  const [copying, setCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
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

  useEffect(() => {
    // Register Teams back button handler when viewing task details
    if (inTeams) {
      const backButtonHandler = () => {
        onCloseTask();
        return true;
      };

      microsoftTeams.pages.backStack.registerBackButtonHandler(
        backButtonHandler
      );

      // Cleanup: unregister the handler when component unmounts
      return () => {
        microsoftTeams.pages.backStack.registerBackButtonHandler(null);
      };
    }
  }, [inTeams, onCloseTask]);

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

  const getTaskLink = async () => {
    const baseUrl = getBaseUrl();
    if (isGroupRoute && isListItem) {
      if (!threadId) {
        throw new Error("The channel or chat for this task is unavailable.");
      }
      const url = new URL("/group", baseUrl);
      url.searchParams.set("task", activeTask._id);
      url.searchParams.set("threadId", threadId);
      return url.toString();
    }
    if (!isListItem && shareTag) {
      const url = new URL("/", baseUrl);
      url.searchParams.set("task", activeTask._id);
      url.searchParams.set("shareTag", shareTag);
      return url.toString();
    }
    const url = await tasksService.getShareUrl(activeTask._id);
    if (typeof url !== "string" || !url) {
      throw new Error(privateShareErrorMessage);
    }
    const shareUrl = new URL(url);
    return `${baseUrl}${shareUrl.pathname}${shareUrl.search}${shareUrl.hash}`;
  };

  const copyLink = async () => {
    setCopying(true);
    setCopyMessage("");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Copying links is not supported in this browser.");
      }
      const url = await getTaskLink();
      await navigator.clipboard.writeText(url);
      setCopyMessage("Link copied.");
    } catch (error) {
      setCopyMessage(error.message || "Unable to copy the task link.");
    } finally {
      setCopying(false);
    }
  };

  const share = async () => {
    setShareMessage("");
    try {
      const url = await getTaskLink();
      await microsoftTeams.sharing.shareWebContent({
        content: [{ type: "URL", url, preview: true }],
      });
    } catch (error) {
      setShareMessage(error.message || "Unable to share the task.");
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
      {loading || isListLoading ? (
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
              <div className="task-field">
                <DefaultButton
                  onClick={copyLink}
                  text="Copy link"
                  iconProps={{ iconName: "Link" }}
                  disabled={copying}
                />
                <p role="status">{copyMessage}</p>
              </div>
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
