import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Backend: Lambda Function
    const backendFunction = new PythonFunction(this, 'FastAPIFunction', {
      entry: '../backend',
      runtime: lambda.Runtime.PYTHON_3_13,
      index: 'main.py',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      },
    });

    // Backend: HTTP API Gateway
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        backendFunction
      ),
    });

    // Frontend: S3 Bucket
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Origin Access Control
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: 'WebsiteBucketOAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'OAC for CloudFront to access S3 bucket',
      },
    });

    //Custom Domain Configuration
    const domainName = 'lambda-learning.kstrm.com';
    const hostedZoneId = 'Z0928598EYO9M4LDLVZL';
    const zoneName = 'kstrm.com';

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName,
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      'arn:aws:acm:us-east-1:463438090254:certificate/feec6310-4b3f-4515-ac9c-3e919f62cc56'
    );

    // Frontend: CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domainName],
      certificate: certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Route53 A Record
    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution)
      ),
    });

    // Associate OAC with CloudFront distribution
    const cfnDistribution = distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.attrId);
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.DomainName', websiteBucket.bucketRegionalDomainName);
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.CustomOriginConfig', undefined);

    // Grant CloudFront permission to read from the bucket
    websiteBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${websiteBucket.bucketArn}/*`],
      principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    }));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
      description: 'HTTP API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
  }
}