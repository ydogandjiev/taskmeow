function normalizeTaskTitle(title) {
  return typeof title === "string"
    ? title.trim().replace(/\s+/g, " ").toLocaleLowerCase()
    : "";
}

export function findTaskByTitle(tasks, title) {
  const exactMatch = tasks.find((task) => task.title === title);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedTitle = normalizeTaskTitle(title);
  if (!normalizedTitle) {
    return undefined;
  }

  return tasks.find(
    (task) => normalizeTaskTitle(task.title) === normalizedTitle
  );
}
