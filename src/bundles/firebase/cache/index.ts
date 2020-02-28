import { CollectionReference, DocumentReference, Query } from '../types';

interface QueryState<T> {
  value: T | null;
  listeners: ((data: any) => void)[];
}

type Disposer = () => void;

class FirestoreCache {
  cachedCollectionQueries: Map<CollectionReference | Query, QueryState<Map<string, any>>> = new Map();
  cachedDocumentQueries: Map<DocumentReference, QueryState<any>> = new Map();
  disposers: Disposer[] = [];
  
  getOnce<T>(reference: DocumentReference): Promise<T> {
    return new Promise<any>(resolve => {
      const dispose = this.listenDocument(reference, data => {
        resolve(data);
        dispose();
      });
    });
  }
  
  getManyOnce<T>(reference: CollectionReference | Query): Promise<T[]> {
    return new Promise<any>(resolve => {
      const dispose = this.listenCollection(reference, data => {
        resolve(data);
        dispose();
      });
    });
  }
  
  listenCollection(reference: CollectionReference | Query, callback: (data: any) => void, onFailed?: (error: Error) => void): Disposer {
    let state = this.cachedCollectionQueries.get(reference);
    let firestoreDisposer: Disposer | null = null;
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
      firestoreDisposer = reference.onSnapshot(snapshot => {
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
      }, error => console.error('Firestore: Document read failed with error', error.message, reference));
    }
    const disposer = () => {
      this.unsubscribe(reference, callback);
      firestoreDisposer?.();
    };
    this.disposers.push(disposer);
    return disposer;
  }
  
  listenDocument(reference: DocumentReference, callback: (data: any) => void): Disposer {
    let state = this.cachedDocumentQueries.get(reference);
    let firestoreDisposer: Disposer | null = null;
    if (state) {
      state.listeners.push(callback);
      callback(state.value);
    } else {
      state = {
        value: null,
        listeners: [callback],
      };
      this.cachedDocumentQueries.set(reference, state);
      firestoreDisposer = reference.onSnapshot(snapshot => {
        if (state) {
          state.value = snapshot.data() ?? null;
        }
        state!.listeners.forEach(listener => listener(state?.value));
      }, error => console.error('Firestore: Document read failed with error', error.message, reference.path));
    }
    const disposer = () => {
      this.unsubscribeSingle(reference, callback);
      firestoreDisposer?.();
    };
    this.disposers.push(disposer);
    return disposer;
  }
  
  clear() {
    this.disposers.forEach(d => d());
    this.disposers = [];
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
