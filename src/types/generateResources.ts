export type IResource = IService | IDeployment | IIngress

export type IApiVersions = {
  V1: 'v1'
  APP_V1: 'apps/v1'
  V1_BETA_1: 'extensions/v1beta1'
}

export type IKinds = {
  DEPLOYMENT: 'Deployment'
  INGRESS: 'Ingress'
  SERVICE: 'Service'
}

export type IApp = {
  [key: string]: string
}

export type IPath = {
  path: string
  backend: {
    serviceName: string
    servicePort: number
  }
}

export type IContainerPort = {
  containerPort: number
}

export type IServicePort = {
  port: number
  targetPort?: number
  nodePort?: number
  protocol?: string
}

export type IContainer = {
  name: string
  image: string
  ports: IContainerPort[]
}

export type IAnnotation = { [key: string]: string }

export type IRule = {
  http: {
    paths: IPath[]
  }
}

export type IDeployment = {
  apiVersion: IApiVersions['APP_V1']
  kind: IKinds['DEPLOYMENT']
  metadata: {
    name: string
    labels: IApp
  }
  spec: {
    replicas: number
    selector: {
      matchLabels: IApp
    }
    template: {
      metadata: {
        labels: IApp
      }
      spec: {
        containers: IContainer[]
      }
    }
  }
}

export type IIngress = {
  apiVersion: IApiVersions['V1_BETA_1']
  kind: IKinds['INGRESS']
  metadata: {
    name: string
    annotations: IAnnotation
  }
  spec: {
    rules: IRule[]
  }
}

export type IService = {
  apiVersion: IApiVersions['V1']
  kind: IKinds['SERVICE']
  metadata: { name: string }
  spec: {
    selector: IApp
    ports: IServicePort[]
    type: string
  }
}

export type IAnswers<T> = {
  isExposed: boolean
  app: string
  image: string
  tag: string
  replicas: number
  containerPort: number
  otherPorts?: T[]
  otherContainers?: IContainer[]
  otherPaths?: IPath[]
}
