import _ from 'lodash';

interface Date {
  clone(): Date;
}

//@ts-ignore
Date.prototype.clone = function(): Date {
  return _.clone(this);
};
