
import { Collection, HTTPOptions, RequestInfo } from '../Library/Index';
import { Topic } from './Topic';

interface Params {
}

interface Query {
}

@Collection.model(Topic)
export class Topics extends Collection<Topic> {
    public onFetch(requestInfo: RequestInfo<Params, Query>) {
        if (inServer) {
            this.setFetchOptions({
                accessToken: requestInfo.cookies.accessToken,
            });
        }
    }
}
