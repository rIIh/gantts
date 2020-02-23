import { CollectionReference, DocumentReference, Query } from '../types';

interface QueryState<T> {
  value: T | null;
  listeners: ((data: any) => void)[];
}

type Disposer = () => void;

class FirestoreCache {
  cachedCollectionQueries: Map<CollectionReference | Query, QueryState<Map<string, any>>> = new Map<CollectionReference, QueryState<Map<string, any>>>();
  cachedDocumentQueries: Map<DocumentReference, QueryState<any>> = new Map<DocumentReference, QueryState<any>>();
  
  getOnce(reference: DocumentReference): Promise<any> {
    return new Promise<any>(resolve => {
      const dispose = this.listenDocument(reference, data => {
        resolve(data);
        dispose();
      });
    });
  }
  
  getManyOnce(reference: CollectionReference): Promise<any> {
    return new Promise<any>(resolve => {
      const dispose = this.listenCollection(reference, data => {
        resolve(data);
        dispose();
      });
    });
  }
  
  listenCollection(reference: CollectionReference | Query, callback: (data: any) => void, onFailed?: (error: Error) => void): Disposer {
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
        if (snapshot.empty) {
          state!.listeners.forEach(listener => listener([]));
        }
        try {
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
          console.log('Firestore Cache: Changes occured', state);
          state!.listeners.forEach(listener => listener([...state!.value!.values()]));
        } catch (e) {
          onFailed?.(e);
        }
      });
    }
    return () => this.unsubscribe(reference, callback);
  }
  
  listenDocument(reference: DocumentReference, callback: (data: any) => void): Disposer {
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
  
  unsubscribe(reference: CollectionReference | Query, callback: (data: any) => void) {
    const state = this.cachedCollectionQueries.get(reference);
    state?.listeners?.splice(state.listeners.indexOf(callback), 1);
    if (state?.listeners.length == 0) {
      this.cachedCollectionQueries.delete(reference);
    }
  }
}

export const CachedQueriesInstance = new FirestoreCache();
