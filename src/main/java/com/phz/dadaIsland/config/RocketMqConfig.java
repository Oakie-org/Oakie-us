package com.phz.dadaIsland.config;

import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RocketMqConfig {

	@Bean
	public RocketMQTemplate rocketMqTemplate(RocketMQTemplate delegate) {
		// Placeholder bean for further customization (message converter, retry policies, etc.)
		return delegate;
	}
}
