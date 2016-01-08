
import { Model, HTTP, HTTPResponse, ErrorResponse, RequestInfo } from '../../Library/Index';

const enum DeleteEmailVerificationFeedback {
    VerificationNotFound,
}

interface EmailVerification {
    isVerified: boolean;
}

interface Query {
    userId: string;
    token: string;
}

interface Params {
}

export class AppTopBarModel extends Model<EmailVerification> {
    public fetch(requestInfo: RequestInfo<Params, Query>) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
