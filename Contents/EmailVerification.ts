
import { Model, HTTP, HTTPResponse, ErrorResponse, RequestInfo } from '../Library/Index';

const enum DeleteEmailVerificationFeedback {
    VerificationNotFound,
}

interface Props {
    isVerified: boolean;
}

interface Query {
    userId: string;
    token: string;
}

interface Params {
}

export class EmailVerification extends Model<Props> {
    public fetch(requestInfo: RequestInfo<Params, Query>) {
        if (!requestInfo.query.token || !requestInfo.query.userId) {
            return Promise.reject(new Error('No supplied queries.'));
        }
        return new Promise((resolve, reject) => {
            HTTP.del(`/users/${requestInfo.query.userId}/email-verification`, {
                    body: {
                        token: requestInfo.query.token,
                    }
                })
                .then(() => {
                    this.set('isVerified', true);
                    resolve();
                })
                .catch((err: Error | HTTPResponse<ErrorResponse> ) => {
                    if (err instanceof Error) {
                        reject(err);
                    }
                    else {
                        if (err.body.feedback.current.code === DeleteEmailVerificationFeedback.VerificationNotFound) {
                            try {
                                this.set('isVerified', false);
                            }
                            catch(err) {
                                console.log(err.stack);
                            }
                            return resolve();
                        }
                        reject(err);
                    }
                });
        });
    }
}
