import firebase from 'firebase';
import { ExtraUserInfo } from '../../user/types';
import { attachID, FirestoreApp } from '../../common/services/firebase';
import { LazyProject } from '../../projects/types';
import _ from 'lodash';

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

export interface DocumentReferencePath {
  path: string;
  uid: string;
}

interface QueryState<T> {
  value: T | null;
  listeners: ((data: any) => void)[];
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

class FirestoreCache {
  cachedCollectionQueries: Map<CollectionReference, QueryState<Map<string, any>>> = new Map<CollectionReference, QueryState<Map<string, any>>>();
  cachedDocumentQueries: Map<DocumentReference, QueryState<any>> = new Map<DocumentReference, QueryState<any>>();
  
  subscribe(reference: CollectionReference, callback: (data: any) => void): Disposer {
    let state = this.cachedCollectionQueries.get(reference);
    if (state) {
      state.listeners.push(callback);
      callback([...state.value?.values() ?? []]);
    } else {
      state = {
        value: null,
        listeners: [callback],
      };
      this.cachedCollectionQueries.set(reference, state);
      state.value = new Map();
      reference.onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        if (snapshot.empty && !changes.some(ch => ch.type == 'removed')) {
          return;
        }
        changes.forEach(change => {
          switch (change.type) {
            case 'modified':
            case 'added': {
              state!.value!.set(change.doc.id, change.doc.data());
              break;
            }
            case 'removed': {
              state!.value!.delete(change.doc.id);
            }
          }
        });
        state!.listeners.forEach(listener => listener([...state!.value!.values()]));
      });
    }
    return () => this.unsubscribe(reference, callback);
  }
  
  subscribeSingle(reference: DocumentReference, callback: (data: any) => void): Disposer {
    let state = this.cachedDocumentQueries.get(reference);
    if (state) {
      state.listeners.push(callback);
      callback(state.value);
    } else {
      state = {
        value: null,
        listeners: [callback],
      };
      this.cachedDocumentQueries.set(reference, state);
      reference.onSnapshot(snapshot => {
        if (state) {
          state.value = snapshot.data() ?? null;
        }
        state!.listeners.forEach(listener => listener(state?.value));
      });
    }
    return () => this.unsubscribeSingle(reference, callback);
  }
  
  unsubscribeSingle(reference: DocumentReference, callback: (data: any) => void) {
    const state = this.cachedDocumentQueries.get(reference);
    state?.listeners?.splice(state.listeners.indexOf(callback), 1);
    if (state?.listeners.length == 0) {
      this.cachedDocumentQueries.delete(reference);
    }
  }
  
  unsubscribe(reference: CollectionReference, callback: (data: any) => void) {
    const state = this.cachedCollectionQueries.get(reference);
    state?.listeners?.splice(state.listeners.indexOf(callback), 1);
    if (state?.listeners.length == 0) {
      this.cachedCollectionQueries.delete(reference);
    }
  }
}

const CachedQueriesInstance = new FirestoreCache();

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
    this.disconnect = CachedQueriesInstance.subscribeSingle(this.reference, data => {
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
          const unsubscribe = CachedQueriesInstance.subscribe(this.reference, data => {
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
    this.disconnect = CachedQueriesInstance.subscribe(this.reference, data => {
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
