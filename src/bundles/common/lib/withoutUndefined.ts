import _ from 'lodash';

export const withoutUndefined = <T>(object: T): Partial<T> => {
  return _.omitBy(object, _.isNil) as Partial<T>;
};
