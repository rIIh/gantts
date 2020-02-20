import _ from 'lodash';

export const fractionByTruth = <T>(list: T[], selector?: (el: T) => boolean, precision: number = 3) => {
  const result = list.length > 0 ? _.without(selector ? list.map(selector) : list.map(el => !_.isNil(el)), false).length / list.length : 0;
  return Math.floor(result * Math.pow(10, precision)) / Math.pow(10, precision);
};

export const prettyNum = (number: number | string, precision: number = 1) => (+number).toFixed(precision).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1');

declare global {
  interface String {
    pretty(this: string, precision: number) : string;
  }
}

String.prototype.pretty = prettyNum;
