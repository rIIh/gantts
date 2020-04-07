import { Task, TaskGroup } from '../types';

export const clearDependencies = async (task: Task): Promise<void> => {
  for (let dep of [...task.dependsOn?.() ?? []]) {
    const depTask = (await dep.get()).data() as Task;
    // @ts-ignore
    console.assert(depTask != null, dep);
    const depList = depTask.dependentOn;
    depList?.().splice(depList!().findIndex(t => t.id == task.uid), 1);
    await dep.update({ dependentOn: depList?.().map(doc => ({ uid: doc.id, path: doc.path })) });
  }
  for (let dep of [...task.dependentOn?.() ?? []]) {
    const depTask = (await dep.get()).data() as Task;
    const depList = depTask.dependsOn;
    depList?.().splice(depList!().findIndex(t => t.id == task.uid), 1);
    await dep.update({ dependsOn: depList?.().map(doc => ({ uid: doc.id, path: doc.path })) });
  }
};

export const allTasks = async (group: TaskGroup | TaskGroup[]): Promise<Task[]> => {
  let result: Task[] = [];
  if (group instanceof Array) {
    for (let g of group) {
      result.push(...await allTasks(g));
    }
  } else {
    result.push(...(await group.tasks().get()).docs.map(doc => doc.data() as Task));
    result.push(...await allTasks((await group.taskGroups().get()).docs.map(doc => doc.data() as TaskGroup)));
  }
  return result;
};
