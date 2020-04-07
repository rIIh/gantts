import cuid from 'cuid';

export interface IDateRange {
  readonly start: Date;
  readonly end: Date;
}

export class DateRange implements IDateRange {
  readonly end: Date;
  readonly start: Date;
  
  constructor(start: Date, end: Date = start) {
    this.start = start.clone();
    this.end = end.clone();
  }
}

export interface Node {
  parent: Node | undefined;
  nodes: Node[];
}

export type Root = Omit<Node, 'parent'>;
export type LastNode = Omit<Node, 'nodes'>;

interface MetaInformation {
  note: string;
  discussion: any[];
  documents: any[];
}

interface Model extends MetaInformation {
  uid: string;
  title: string;
}

export interface ProjectModel extends Root, Model {

}

export interface GroupModel extends Node, Model {

}

export interface TaskModel extends LastNode, Model {

}
