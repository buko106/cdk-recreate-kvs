import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib/core';
import type { Construct } from 'constructs';

export class RecreateKvsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // オリジン用のダミーバケット
    const originBucket = new s3.Bucket(this, 'OriginBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Key-Value Storeのソースデータをインラインで定義（文字列化されたJSONを渡す）
    const kvsSource = cloudfront.ImportSource.fromInline(
      JSON.stringify({
        data: [{ key: 'url', value: 'https://recruite.example.com' }],
      }),
    );

    // Key-Value Storeの作成
    const keyValueStore = new cloudfront.KeyValueStore(this, 'KeyValueStore', {
      source: kvsSource,
    });

    // CloudFront Functionでリダイレクト処理
    const redirectFunction = new cloudfront.Function(this, 'Function', {
      code: cloudfront.FunctionCode.fromFile({
        filePath: 'lib/redirect.js',
      }),
      keyValueStore,
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    // CloudFront ディストリビューションを作成し、Viewer Request イベントでFunctionを関連付け
    new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origin.S3BucketOrigin.withOriginAccessControl(originBucket),
        functionAssociations: [
          {
            function: redirectFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
    });
  }
}
