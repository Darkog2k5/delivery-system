package vn.ptit.spx.userservice.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;
    private final String field;

    public ApiException(HttpStatus status, String message, String errorCode) {
        this(status, message, errorCode, null);
    }

    public ApiException(HttpStatus status, String message, String errorCode, String field) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.field = field;
    }

    public HttpStatus getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
    public String getField() { return field; }
}
