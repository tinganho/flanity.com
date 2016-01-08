
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

export class EmailVerificationModel extends Model<EmailVerification> {
    public fetch(requestInfo: RequestInfo<Params, Query>) {
        return new Promise((resolve, reject) => {
            HTTP.del(`/users/${requestInfo.query.userId}/email-verification`, {
                    body: {
                        token: requestInfo.query.token,
                    }
                })
                .then(() => {
                    this.setProp('isVerified', true);
                    resolve();
                })
                .catch((err: Error | HTTPResponse<ErrorResponse> ) => {
                    if (err instanceof Error) {
                        reject(err);
                    }
                    else {
                        if (err.body.feedback.current.code === DeleteEmailVerificationFeedback.VerificationNotFound) {
                            try {
                                this.setProp('isVerified', false);
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
