// src/hooks/useOptimisticUpdate.jsx
import { useState } from "react";

const useOptimisticUpdate = () => {
  const [previousState, setPreviousState] = useState(null);

  // Apply optimistic update to the email state
  const applyOptimisticUpdate = (
    allEmails,
    emails,
    action,
    emailIds,
    payload
  ) => {
    setPreviousState({ allEmails: [...allEmails], emails: [...emails] }); // Store previous state for rollback

    let updatedAllEmails = [...allEmails];
    let updatedEmails = [...emails];

    switch (action) {
      case "markAsRead":
      case "markAsUnread":
        updatedAllEmails = allEmails.map((email) =>
          emailIds.includes(email.messageId)
            ? { ...email, seen: action === "markAsRead" }
            : email
        );
        updatedEmails = emails.map((email) =>
          emailIds.includes(email.messageId)
            ? { ...email, seen: action === "markAsRead" }
            : email
        );
        break;
      case "flagEmail":
      case "unflagEmail":
        updatedAllEmails = allEmails.map((email) =>
          emailIds.includes(email.messageId)
            ? { ...email, flagged: action === "flagEmail" }
            : email
        );
        updatedEmails = emails.map((email) =>
          emailIds.includes(email.messageId)
            ? { ...email, flagged: action === "flagEmail" }
            : email
        );
        break;
      case "moveEmail":
        updatedAllEmails = allEmails.map((email) =>
          emailIds.includes(email.messageId)
            ? { ...email, folder: payload.targetFolder }
            : email
        );
        updatedEmails = emails.filter(
          (email) => !emailIds.includes(email.messageId)
        ); // Remove from current folder
        break;
      case "deleteEmails":
        updatedAllEmails = allEmails.filter(
          (email) => !emailIds.includes(email.messageId)
        );
        updatedEmails = emails.filter(
          (email) => !emailIds.includes(email.messageId)
        );
        break;
      case "deletePermanentAll":
        updatedAllEmails = allEmails.filter(
          (email) => email.folder?.toLowerCase() !== "deleted"
        );
        updatedEmails = []; // Clear all emails in the deleted folder
        break;
      default:
        return { updatedAllEmails: allEmails, updatedEmails: emails };
    }

    return { updatedAllEmails, updatedEmails };
  };

  // Rollback to previous state
  const rollbackUpdate = () => {
    if (previousState) {
      return {
        updatedAllEmails: [...previousState.allEmails],
        updatedEmails: [...previousState.emails],
      };
    }
    return null;
  };

  // Clear previous state after successful update
  const clearPreviousState = () => {
    setPreviousState(null);
  };

  return { applyOptimisticUpdate, rollbackUpdate, clearPreviousState };
};

export default useOptimisticUpdate;
