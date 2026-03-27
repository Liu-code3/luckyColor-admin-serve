declare module 'svg-captcha' {
  export interface MathExprOptions {
    mathMin?: number;
    mathMax?: number;
    mathOperator?: '+' | '-' | '+-';
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
    fontSize?: number;
  }

  export interface CaptchaResult {
    data: string;
    text: string;
  }

  export function createMathExpr(options?: MathExprOptions): CaptchaResult;

  const svgCaptcha: {
    createMathExpr: typeof createMathExpr;
  };

  export default svgCaptcha;
}
