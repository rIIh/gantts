import { LazyTask, LazyTaskGroup } from '../types';

export const clearDependencies = async (task: LazyTask): Promise<void> => {
  for (let dep of [...task.dependsOn?.() ?? []]) {
    const depTask = (await dep.get()).data() as LazyTask;
    // @ts-ignore
    console.assert(depTask != null, dep);
    const depList = depTask.dependentOn;
    depList?.().splice(depList!().findIndex(t => t.id == task.uid), 1);
    await dep.update({ dependentOn: depList?.().map(doc => ({ uid: doc.id, path: doc.path })) });
  }
  for (let dep of [...task.dependentOn?.() ?? []]) {
    const depTask = (await dep.get()).data() as LazyTask;
    const depList = depTask.dependsOn;
    depList?.().splice(depList!().findIndex(t => t.id == task.uid), 1);
    await dep.update({ dependsOn: depList?.().map(doc => ({ uid: doc.id, path: doc.path })) });
  }
};

export const allTasks = async (group: LazyTaskGroup | LazyTaskGroup[]): Promise<LazyTask[]> => {
  let result: LazyTask[] = [];
  if (group instanceof Array) {
    for (let g of group) {
      result.push(...await allTasks(g));
    }
  } else {
    result.push(...(await group.tasks().get()).docs.map(doc => doc.data() as LazyTask));
    result.push(...await allTasks((await group.taskGroups().get()).docs.map(doc => doc.data() as LazyTaskGroup)));
  }
  return result;
};
