/**
 * PostalWorker Main Source (ES6 Version - Exports )
 * Build ES6 module version
 * @Author: Russ Stratfull - 2018
 */


import {PostalWorker} from './PostalWorker';
import safeJsonStringify from "safe-json-stringify";

let _PostalWorker;
export default function (configuration) {
    if (!_PostalWorker) {
        _PostalWorker = new PostalWorker(configuration, safeJsonStringify);
        return _PostalWorker;
    }
    else return _PostalWorker;
}
