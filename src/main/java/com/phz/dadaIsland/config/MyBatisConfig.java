package com.phz.dadaIsland.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.phz.dadaIsland.mapper")
public class MyBatisConfig {
	// Place shared MyBatis configuration here (type handlers, interceptors, etc.)
}
