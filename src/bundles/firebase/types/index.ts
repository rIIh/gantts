import firebase from 'firebase';
import { ExtraUserInfo } from '../../user/types';
import { attachID, FirestoreApp } from '../../common/services/firebase';
import { Project } from '../../projects/types';
import _ from 'lodash';
import { CachedQueriesInstance } from '../cache';

export type DocumentReference = firebase.firestore.DocumentReference;
export const DocumentReference = firebase.firestore.DocumentReference;
export type DocumentData = firebase.firestore.DocumentData;
export const Timestamp = firebase.firestore.Timestamp;
export type Timestamp = firebase.firestore.Timestamp;
export type CollectionReference = firebase.firestore.CollectionReference;
export const CollectionReference = firebase.firestore.CollectionReference;
export type CollectionReferencePath = string;
export type Query = firebase.firestore.Query;
export const FieldPath = firebase.firestore.FieldPath;
export const FieldValue = firebase.firestore.FieldValue;

export interface DocumentReferencePath {
  path: string;
  uid: string;
}

abstract class SubjectObject<Value> {
  protected value: Value | null = null;
  protected listeners: ((data: Value) => void)[] = [];
  
  public subscribe(callback: (data: Value) => void): Disposer {
    this.listeners.push(callback);
    if (this.value) {
      callback(this.value);
    }
    return () => this.unsubscribe(callback);
  }
  
  public unsubscribe(callback: (data: Value) => void) {
    console.log('Listener: Unsubscription');
    this.listeners.splice(this.listeners.indexOf(callback), 1);
  }
}

export class LazyReference<Value, Data extends DocumentData = Value> extends SubjectObject<Value> {
  private reference: DocumentReference;
  
  public get Value(): Promise<Value> | Value {
    if (this.value) {
      return this.value;
    } else {
      return new Promise(resolve => {
        this.connect();
        const unsubscribe = this.subscribe(data => {
          resolve(data);
          this.disconnect?.();
          unsubscribe();
        });
      });
    }
  }
  
  public get Reference(): DocumentReference {
    return this.reference;
  }
  
  public get ID() {
    return this.reference.id;
  }

  public toJson(): DocumentReferencePath {
    return {
      path: this.Reference.path,
      uid: this.Reference.id,
    };
  }
  
  constructor(reference: DocumentReference | string) {
    super();
    this.reference = reference instanceof firebase.firestore.DocumentReference ? reference : FirestoreApp.doc(reference);
  }
  
  withFirestoreConverter(converter: firebase.firestore.FirestoreDataConverter<Value>) {
    this.reference = this.reference.withConverter(converter);
    return this;
  }
  
  connect() {
    this.disconnect = CachedQueriesInstance.listenDocument(this.reference, data => {
      this.value = data;
      this.listeners.forEach(listener => listener(this.value!));
    });
    return this;
  }
  
  private disconnect?: Disposer;
  dispose() {
    this.disconnect?.();
  }
}

type Disposer = () => void;

export class LazyCollectionReference<Value, Data extends DocumentData = Value> extends SubjectObject<Value[]>{
  // private value: Value[] | null = null;
  private reference: CollectionReference;
  private connected: boolean = false;
  
  public get ID() {
    return this.reference.path;
  }
  
  
  constructor(reference: CollectionReference | CollectionReferencePath) {
    super();
    this.reference = reference instanceof firebase.firestore.CollectionReference ? reference : FirestoreApp.collection(reference);
  }
  
  public get Value(): Promise<Value[]> | Value[] {
    const cached = CachedQueriesInstance.cachedCollectionQueries.get(this.reference);
    if (cached && cached.value) {
      return [...cached.value.values()];
    } else {
      if (this.value) {
        return this.value;
      } else {
        return new Promise(resolve => {
          const unsubscribe = CachedQueriesInstance.listenCollection(this.reference, data => {
            resolve(data);
            unsubscribe();
          });
        });
      }
    }
  }
  
  dispose() {
    this.disconnect?.();
  }

  public get Reference(): CollectionReference {
    return this.reference;
  }
  
  public toJson(): CollectionReferencePath {
    return this.Reference.path;
  }
  
  withFirestoreConverter(converter: firebase.firestore.FirestoreDataConverter<Value>) {
    this.reference = this.reference.withConverter(converter);
    return this;
  }
  
  private disconnect?: Disposer;
  connect() {
    if (this.connected) { return this; }
    this.disconnect = CachedQueriesInstance.listenCollection(this.reference, data => {
      this.value = data;
      this.listeners.forEach(listener => listener(this.value!));
    });
    this.connected = true;
    return this;
  }
}

type ReferenceBuilder = (...args: any[]) => Promise<(DocumentReference | CollectionReference | Query)> | (DocumentReference | CollectionReference | Query);

export class Firestore {
  [key: string]: DocumentReference | CollectionReference | ReferenceBuilder | String | Query;
}
