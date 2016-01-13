
import { Collection, HTTPOptions, RequestInfo, URL, model } from '../Library/Index';
import { Topic } from './Topic';

interface Params {
}

interface Query {
}

@model(Topic)
export class Topics extends Collection<Topic> {
    public onFetch(requestInfo: RequestInfo<Params, Query>) {
        this.setFetchOptions({
            accessToken: requestInfo.cookies.accessToken,
        });
    }
}
