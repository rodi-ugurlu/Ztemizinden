package com.iknow.ztemizindenbackend.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", havingValue = "true", matchIfMissing = true)
class FlywayMigrationConfig {
    private static final String MIGRATOR_BEAN_NAME = "ztemizindenFlywayMigrator";

    @Bean
    @ConditionalOnMissingBean(Flyway.class)
    Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();
    }

    @Bean(name = MIGRATOR_BEAN_NAME)
    FlywayMigrator flywayMigrator(Flyway flyway) {
        return new FlywayMigrator(flyway);
    }

    @Bean
    static BeanFactoryPostProcessor entityManagerFactoryDependsOnFlyway() {
        return new EntityManagerFactoryDependsOnFlywayPostProcessor();
    }

    private record FlywayMigrator(Flyway flyway) implements InitializingBean {
        @Override
        public void afterPropertiesSet() {
            flyway.migrate();
        }
    }

    private static class EntityManagerFactoryDependsOnFlywayPostProcessor implements BeanFactoryPostProcessor {
        @Override
        public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
            if (!beanFactory.containsBeanDefinition("entityManagerFactory")) {
                return;
            }

            BeanDefinition beanDefinition = beanFactory.getBeanDefinition("entityManagerFactory");
            String[] dependsOn = beanDefinition.getDependsOn();
            if (dependsOn == null || dependsOn.length == 0) {
                beanDefinition.setDependsOn(MIGRATOR_BEAN_NAME);
                return;
            }

            String[] updatedDependsOn = new String[dependsOn.length + 1];
            System.arraycopy(dependsOn, 0, updatedDependsOn, 0, dependsOn.length);
            updatedDependsOn[dependsOn.length] = MIGRATOR_BEAN_NAME;
            beanDefinition.setDependsOn(updatedDependsOn);
        }
    }
}
