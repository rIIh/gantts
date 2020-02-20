import { useEffect, useRef } from 'react';
import _ from 'lodash';

export const log = _.throttle((...args: any[]) => console.log(args), 1000);

function difference(object: any, base: any) {
  function changes(object: any, base: any) {
    return _.transform(object, function(result: { [key: string]: any }, value, key) {
      if (!_.isEqual(value, base[key])) {
        result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
      }
    });
  }
  return changes(object, base);
}

export function useTraceUpdate(props: any) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce<{ [key: string]: any }>((ps, [k, v]) => {
      if (!_.isEqual(prev.current[k], v)) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      log('Changed props: ', changedProps, 'Difference: ', difference(changedProps[1], changedProps[0]));
    }
    prev.current = props;
  });
}
