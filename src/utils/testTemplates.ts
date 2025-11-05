/**
 * 测试代码模板引擎
 * 用于将 HTTP 请求转换为各种语言/框架的单元测试代码
 */

// ========== 类型定义 ==========

/**
 * 测试代码模板
 */
export interface TestCodeTemplate {
  id: string
  name: string
  language: string
  framework: string
  description: string
  icon: string
}

/**
 * 测试代码参数
 */
export interface TestCodeParams {
  method: string
  url: string
  headers: Array<{ key: string; value: string }>
  body: string
  statusCode?: number
  responseData?: any
}

// ========== 模板常量 ==========

/**
 * RestAssured 模板（Java）
 */
const RESTASSURED_TEMPLATE = (params: TestCodeParams) => {
  const { method, url, headers, body, statusCode, responseData } = params
  
  // 解析 URL
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`
  const path = urlObj.pathname + urlObj.search
  
  // 生成 headers
  const headerLines = headers
    .filter(h => h.key && h.value)
    .map(h => `        .header("${h.key}", "${h.value}")`)
    .join('\n')
  
  // 生成 body
  let bodyLine = ''
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    try {
      // 验证是否是有效 JSON
      JSON.parse(body)
      bodyLine = `        .body(${JSON.stringify(body)})`
    } catch {
      bodyLine = `        .body("${body.replace(/"/g, '\\"')}")`
    }
  }
  
  // 生成断言
  let assertions = `        .statusCode(${statusCode || 200})`
  if (responseData && typeof responseData === 'object') {
    // 尝试生成字段断言
    const firstKey = Object.keys(responseData)[0]
    if (firstKey) {
      const firstValue = responseData[firstKey]
      if (typeof firstValue === 'string' || typeof firstValue === 'number') {
        assertions += `\n        .body("${firstKey}", equalTo(${JSON.stringify(firstValue)}))`
      }
    }
  }
  
  return `import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import org.junit.jupiter.api.Test;

public class ApiTest {
    
    @Test
    public void test${capitalize(method)}${sanitizeMethodName(path)}() {
        given()
            .baseUri("${baseUrl}")
${headerLines ? headerLines + '\n' : ''}${bodyLine ? bodyLine + '\n' : ''}        .when()
            .${method.toLowerCase()}("${path}")
        .then()
${assertions};
    }
}`
}

/**
 * MockMvc 模板（Spring Boot）
 */
const MOCKITO_TEMPLATE = (params: TestCodeParams) => {
  const { method, url, headers, body, statusCode } = params
  
  const urlObj = new URL(url)
  const path = urlObj.pathname + urlObj.search
  
  // 生成 headers
  const headerLines = headers
    .filter(h => h.key && h.value)
    .map(h => `            .header("${h.key}", "${h.value}")`)
    .join('\n')
  
  // 生成 body
  let bodyLine = ''
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    bodyLine = `            .content(${JSON.stringify(body)})`
  }
  
  return `import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void test${capitalize(method)}${sanitizeMethodName(path)}() throws Exception {
        mockMvc.perform(${method.toLowerCase()}("${path}")
${headerLines ? headerLines + '\n' : ''}${bodyLine ? bodyLine + '\n' : ''}        )
        .andExpect(status().is(${statusCode || 200}));
    }
}`
}

/**
 * Pytest 模板（Python + Requests）
 */
const PYTEST_TEMPLATE = (params: TestCodeParams) => {
  const { method, url, headers, body, statusCode } = params
  
  // 生成 headers
  const headersDict = headers
    .filter(h => h.key && h.value)
    .reduce((acc, h) => {
      acc[h.key] = h.value
      return acc
    }, {} as Record<string, string>)
  
  const headersLine = Object.keys(headersDict).length > 0
    ? `    headers = ${JSON.stringify(headersDict, null, 8)}`
    : ''
  
  // 生成 body
  let bodyLine = ''
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    try {
      JSON.parse(body)
      bodyLine = `    json_data = ${body}`
    } catch {
      bodyLine = `    data = ${JSON.stringify(body)}`
    }
  }
  
  const methodLower = method.toLowerCase()
  const dataParam = bodyLine.includes('json_data') ? ', json=json_data' : bodyLine.includes('data') ? ', data=data' : ''
  const headersParam = headersLine ? ', headers=headers' : ''
  
  return `import requests
import pytest

def test_api_${methodLower}_request():
    """
    测试 ${method} ${url}
    """
${headersLine}
${bodyLine}
    
    response = requests.${methodLower}(
        "${url}"${headersParam}${dataParam}
    )
    
    assert response.status_code == ${statusCode || 200}
    print(f"响应: {response.json()}")
`
}

/**
 * Jest 模板（JavaScript + Axios）
 */
const JEST_TEMPLATE = (params: TestCodeParams) => {
  const { method, url, headers, body, statusCode } = params
  
  // 生成 headers
  const headersObj = headers
    .filter(h => h.key && h.value)
    .reduce((acc, h) => {
      acc[h.key] = h.value
      return acc
    }, {} as Record<string, string>)
  
  const headersLine = Object.keys(headersObj).length > 0
    ? `      headers: ${JSON.stringify(headersObj, null, 6)},`
    : ''
  
  // 生成 body
  let bodyLine = ''
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    try {
      const parsed = JSON.parse(body)
      bodyLine = `      data: ${JSON.stringify(parsed, null, 6)},`
    } catch {
      bodyLine = `      data: ${JSON.stringify(body)},`
    }
  }
  
  return `const axios = require('axios');

describe('API 测试', () => {
  test('${method} ${url}', async () => {
    const response = await axios({
      method: '${method}',
      url: '${url}',
${headersLine}
${bodyLine}
    });
    
    expect(response.status).toBe(${statusCode || 200});
    console.log('响应数据:', response.data);
  });
});
`
}

/**
 * Go HTTP 测试模板
 */
const GO_HTTP_TEMPLATE = (params: TestCodeParams) => {
  const { method, url, headers, body, statusCode } = params
  
  // 生成 headers
  const headerLines = headers
    .filter(h => h.key && h.value)
    .map(h => `\treq.Header.Set("${h.key}", "${h.value}")`)
    .join('\n')
  
  // 生成 body
  let bodySetup = 'var reqBody io.Reader = nil'
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
    bodySetup = `reqBodyStr := \`${body}\`\n\treqBody := strings.NewReader(reqBodyStr)`
  }
  
  return `package main

import (
\t"io"
\t"net/http"
\t"strings"
\t"testing"
)

func TestAPI${capitalize(method)}(t *testing.T) {
\t${bodySetup}
\t
\treq, err := http.NewRequest("${method.toUpperCase()}", "${url}", reqBody)
\tif err != nil {
\t\tt.Fatalf("创建请求失败: %v", err)
\t}
\t
${headerLines ? headerLines + '\n\t' : ''}\t
\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tt.Fatalf("请求失败: %v", err)
\t}
\tdefer resp.Body.Close()
\t
\tif resp.StatusCode != ${statusCode || 200} {
\t\tt.Errorf("期望状态码 %d, 实际 %d", ${statusCode || 200}, resp.StatusCode)
\t}
\t
\tbody, _ := io.ReadAll(resp.Body)
\tt.Logf("响应: %s", string(body))
}
`
}

// ========== 工具函数 ==========

/**
 * 首字母大写
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 清理方法名（移除特殊字符）
 */
function sanitizeMethodName(path: string): string {
  // 移除查询参数
  const pathOnly = path.split('?')[0]
  // 移除斜杠和特殊字符，转为驼峰
  return pathOnly
    .split('/')
    .filter(Boolean)
    .map(capitalize)
    .join('')
}

// ========== 模板列表 ==========

/**
 * 所有可用模板
 */
export const TEMPLATES: TestCodeTemplate[] = [
  {
    id: 'restassured',
    name: 'RestAssured',
    language: 'Java',
    framework: 'RestAssured + JUnit 5',
    description: 'Java REST API 测试框架',
    icon: 'i-mdi-language-java',
  },
  {
    id: 'mockito',
    name: 'MockMvc',
    language: 'Java',
    framework: 'Spring Boot + MockMvc',
    description: 'Spring Boot 单元测试',
    icon: 'i-mdi-leaf',
  },
  {
    id: 'pytest',
    name: 'Pytest',
    language: 'Python',
    framework: 'Pytest + Requests',
    description: 'Python API 测试',
    icon: 'i-mdi-language-python',
  },
  {
    id: 'jest',
    name: 'Jest',
    language: 'JavaScript',
    framework: 'Jest + Axios',
    description: 'JavaScript/Node.js 测试',
    icon: 'i-mdi-language-javascript',
  },
  {
    id: 'go',
    name: 'Go HTTP Test',
    language: 'Go',
    framework: 'Go testing',
    description: 'Go 标准库测试',
    icon: 'i-mdi-language-go',
  },
]

// ========== 核心函数 ==========

/**
 * 生成测试代码
 */
export function generateTestCode(params: TestCodeParams, templateId: string): string {
  switch (templateId) {
    case 'restassured':
      return RESTASSURED_TEMPLATE(params)
    case 'mockito':
      return MOCKITO_TEMPLATE(params)
    case 'pytest':
      return PYTEST_TEMPLATE(params)
    case 'jest':
      return JEST_TEMPLATE(params)
    case 'go':
      return GO_HTTP_TEMPLATE(params)
    default:
      throw new Error(`未知模板: ${templateId}`)
  }
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): TestCodeTemplate[] {
  return TEMPLATES
}

/**
 * 根据模板 ID 获取语言（用于 Snippet 的 language 字段）
 */
export function getLanguageByTemplateId(templateId: string): string {
  const languageMap: Record<string, string> = {
    'restassured': 'java',
    'mockito': 'java',
    'pytest': 'python',
    'jest': 'javascript',
    'go': 'go',
  }
  return languageMap[templateId] || 'plaintext'
}




